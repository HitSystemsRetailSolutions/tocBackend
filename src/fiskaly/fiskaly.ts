import axios, { AxiosInstance } from 'axios';
import { parametrosInstance } from 'src/parametros/parametros.clase';
import { UtilesModule } from 'src/utiles/utiles.module';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CestasInterface } from 'src/cestas/cestas.interface';

type TokenData = {
	// bearer es el token JWT
	bearer: string;
	// expires_at es el tiempo en milisegundos en el que expira el token
	expires_at: number;
	// expires_in es el tiempo en segundos que tarda en expirar el token
	expires_in: number;
};

// Tipos de las peticiones a la API
// En la primera petición, se le pasa el api_key y el api_secret
// En las siguientes, se le pasa el refresh_token
type AuthRequest = {
	content:
		| {
				api_key: string;
				api_secret: string;
		  }
		| {
				refresh_token: string;
		  };
};

type AuthResponse = {
	data: {
		content: {
			access_token: TokenData;
			refresh_token: TokenData;
			// No es necesario, pero viene en la respuesta
			// Por el momento, se deja como unknown.
			// Sirve para extraer el ID de la organización asociada
			// pero no es necesario.
			claims: unknown;
		};
	};
};

// Injectable sirve para poder inyectar la clase en otros servicios
// sin tener que instanciarla manualmente.
// Es importante NO INSTANCIAR la clase manualmente
// ya que NestJS se encarga de hacerlo automáticamente.
// Si se instancia manualmente, la clase no estará "compartida"
// y se perdera el estado de la clase además de perjudicar la performance.
// Cuando necesiteis usar la clase, tenéis que hacerlo así:
// const fiskaly = app.get(Fiskaly);
@Injectable()
export class Fiskaly implements OnModuleInit {
	private readonly axiosClient: AxiosInstance;
    private fiskalyEnabled: boolean = false;
	// Fiskaly
	private apiKey: string | null = null;
	private apiSecret: string | null = null;
	private baseUrl: string | null = null;
	private accessToken: TokenData | null = null;
	private refreshToken: TokenData | null = null;
	private client: string | null = null;
	// Tienda
	private ddbb: string | null = null;
	private licencia: number | null = null;
	private ultimoTicket: number | null = null;

	constructor() {
		// Creamos el cliente de axios
		this.axiosClient = axios.create({
			baseURL: this.baseUrl,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	// Este método se ejecuta automáticamente como parte del ciclo de vida del módulo.
	// `onModuleInit` es un hook de NestJS que se ejecuta después de que
	// se inicie módulo que contiene este provider.
	// Esto se asegura de que la clase es instanciada y gestionada por NestJS,
	// `init()` se llama automáticamente antes de que la aplicación empiece a hacer
	// solicitudes, haciendo que la clase esté lista para ser usada.
	async onModuleInit() {
		await this.init();
	}

	async createTicket(cesta: CestasInterface) {
        if(!this.fiskalyEnabled) return;
        
		try {
			this.checkProperties();
		} catch (error) {
			console.error('Error al comprobar las propiedades', error);
			throw error;
		}

		await this.checkTokens();

		const data = {
			content: {
				type: 'SIMPLIFIED',
				number: this.ultimoTicket + 1,
				text: 'Ticket',
				full_amount: cesta.lista.reduce((acc, cur) => cur.subtotal + acc, 0),
				items: cesta.lista.map((item) => {
                    console.log(item)
                    const total = item.subtotal + item.ivaFiskaly * item.unidades;
                    const dto = item.dto ? total * (1 - item.dto / 100) : 0;
					return {
						text: item.nombre,
						quantity: item.unidades,
                        // Tiene que ser el precio unitario sin IVA
						unit_amount: item.subtotal / item.unidades - item.ivaFiskaly,
						full_amount: total,
						discount: dto,
					};
				}),
			},
		};

		const invoice_id = UtilesModule.generateUuid();

		try {
			await this.axiosClient.put(
				`clients/${this.client}/invoices/${invoice_id}`,
				data,
				{
					headers: {
						Authorization: `Bearer ${this.accessToken.bearer}`,
					},
				}
			);
			// Devolvemos el ID del ticket (invoice_id)
            // para después poder consultar el ticket en Fiskaly
            // y obtener los datos para imprimirlo.
            // Este ID hay que guardarlo en la base de datos para después consultar el ticket.
			return invoice_id;
		} catch (error) {
			console.error('Error al crear el ticket', error);
			return null;
		}
	}

	// Este método sirve para debuggear. Muestra los tokens y el tiempo que les queda
	toString(): string {
		return `
            Access Token: ${JSON.stringify(this.accessToken)}
            Refresh Token: ${JSON.stringify(this.refreshToken)}
            API Key: ${this.apiKey}
            API Secret: ${this.apiSecret}
        `;
	}

	setLastTicket(ticket: number) {
        if(!this.fiskalyEnabled) return;

		this.ultimoTicket = ticket;
	}

	// PRIVATE

	// Esta función se llama en el `onModuleInit` para inicializar la clase
	// y no se puede llamar des del constructor ya que es una función asíncrona.
	private async init() {
		await this.getParamsTienda();

        if(!this.fiskalyEnabled) return;

		try {
			const response = await this.getTokens({
				content: {
					api_key: this.apiKey,
					api_secret: this.apiSecret,
				},
			});
			const { access_token, refresh_token } = response.data.content;
			this.accessToken = access_token;
			this.refreshToken = refresh_token;
		} catch (error) {
			console.error('Error al obtener el token JWT', error);
			throw error;
		}
	}

	// Comprueba si los tokens han expirado
	// Si han expirado, los vuelve a obtener
	// Si el que ha expirado es el access token, se le pasa el refresh token
	// Si han expirado ambos, se le pasa el api_key y el api_secret
	private async checkTokens() {
        if(!this.fiskalyEnabled) return;
        
		if (!this.accessToken || !this.refreshToken) {
			throw new Error('No se han obtenido los tokens');
		}

		const getTokenContent = () => {
			return this.refreshToken.expires_at < Date.now()
				? { api_key: this.apiKey, api_secret: this.apiSecret } // Ambos tokens han expirado
				: { refresh_token: this.refreshToken.bearer }; // Solo ha expirado el access token
		};

		const { expires_at: access_expires_at } = this.accessToken;
		const { expires_at: refresh_expires_at } = this.refreshToken;
		if (access_expires_at > Date.now() && refresh_expires_at > Date.now())
			return;

		try {
			const response = await this.getTokens({
				content: getTokenContent(),
			});
			const { access_token, refresh_token } = response.data.content;
			this.accessToken = access_token;
			this.refreshToken = refresh_token;
		} catch (err) {
			console.error('Error al obtener los tokens', err);
			throw err;
		}
	}

	// Obtiene los tokens de la API
	// Se le pasa un objeto con el api_key y el api_secret o el refresh_token
	private async getTokens(data: AuthRequest): Promise<AuthResponse> {
		return this.axiosClient.post('auth', data);
	}

	// Comprueba si se han obtenido los parámetros de la tienda
	// y el accessToken y el refreshToken
	private checkProperties() {
		if (!this.ddbb || !this.licencia) {
			throw new Error('No se han obtenido los parámetros de la tienda');
		}
		if (!this.client) {
			throw new Error('No se ha obtenido el client');
		}
		if (!this.apiKey || !this.apiSecret) {
			throw new Error('No se han obtenido las credenciales de Fiskaly');
		}
		if (!this.accessToken || !this.refreshToken) {
			throw new Error('No se ha obtenido el token JWT');
		}

		return true;
	}

	// Obtiene los parámetros de la tienda
	private async getParamsTienda() {
		try {
			const params = await parametrosInstance.getParametros();
			const { fiskaly, database, licencia, ultimoTicket } = params;
			this.ddbb = database;
			this.licencia = licencia;
			this.ultimoTicket = ultimoTicket;
			this.apiKey = fiskaly?.API_KEY;
			this.apiSecret = fiskaly?.API_SECRET;
			this.baseUrl = fiskaly?.baseUrl;
			this.client = fiskaly?.client;
            this.fiskalyEnabled = fiskaly?.enabled;
		} catch (error) {
			console.error('Error al obtener los parámetros', error);
			throw error;
		}
	}
}
