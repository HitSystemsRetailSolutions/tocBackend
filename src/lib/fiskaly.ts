// import { parametrosInstance } from "src/parametros/parametros.clase";
import axios, { AxiosInstance } from 'axios';
import { parametrosInstance } from 'src/parametros/parametros.clase';
import { UtilesModule } from 'src/utiles/utiles.module';

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

export class Fiskaly {
	// Fiskaly
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly baseUrl = 'https://test.es.sign.fiskaly.com/api/v1/';
	private readonly axiosClient: AxiosInstance;
	private accessToken: TokenData | null;
	private refreshToken: TokenData | null;
	private signer: string | null;
	private client: string | null;
	// Tienda
	private ddbb: string | null;
	private licencia: number | null;

	constructor() {
		// Cogemos las keys de las variables de entorno
		this.apiKey = process.env.FISKALY_API_KEY || null;
		this.apiSecret = process.env.FISKALY_API_SECRET || null;
		// Creamos el cliente de axios
		this.axiosClient = axios.create({
			baseURL: this.baseUrl,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	// Hay que llamar a esta función antes de hacer cualquier otra llamada a la API
	// Es decir, despues de instanciar la clase, hay que llamar a esta función
	// para obtener el token JWT
	// Si no se llama a esta función, no se podrá hacer ninguna llamada a la API
	// Ejemplo:
	// const fiskaly = new Fiskaly();
	// await fiskaly.init();
	async init() {
		await this.getParamsTienda();

		if (this.accessToken && this.refreshToken) {
			// TODO: refactorizar esto
			await this.setSigner();
			await this.setClient();
			return;
		}

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

		// await this.setTaxpayer();
		await this.setSigner();
		await this.setClient();
	}

	async createTicket(items: any[]) {
		await this.checkTokens();

		const data = {
			type: 'SIMPLIFIED',
			number: `E-${Date.now()}`,
			text: 'Ticket',
			full_amount: items.reduce((acc, item) => acc + item.price, 0),
			items,
		};
	}

	// Este método sirve para debuggear. Muestra los tokens y el tiempo que les queda
	toString(): string {
		return `Fiskaly API Key: ${this.apiKey}, Fiskaly
        API Secret: ${this.apiSecret}, Access Token: ${this.accessToken.bearer}, Refresh Token: ${this.refreshToken.bearer}`;
	}

	// PRIVATE

	private async checkTokens() {
		if (!this.accessToken || !this.refreshToken) {
			throw new Error('No se han obtenido los tokens');
		}

		const getTokenContent = () => {
			return this.refreshToken.expires_at < Date.now()
				? { api_key: this.apiKey, api_secret: this.apiSecret } // Ambos tokens han expirado
				: { refresh_token: this.refreshToken.bearer }; // Solo ha expirado el access token
		};

		if (
			this.accessToken.expires_at < Date.now() ||
			this.refreshToken.expires_at < Date.now()
		) {
			await this.getTokens({ content: getTokenContent() });
		}
	}

	private async getTokens(data: AuthRequest): Promise<AuthResponse> {
		return this.axiosClient.post('auth', data);
	}

	private checkProperties() {
		if (!this.ddbb || !this.licencia) {
			throw new Error('No se han obtenido los parámetros de la tienda');
		}
		if (!this.accessToken || !this.refreshToken) {
			throw new Error('No se ha obtenido el token JWT');
		}
		return true;
	}

	private async getParamsTienda() {
		if (this.ddbb) return;
		try {
			const params = await parametrosInstance.getParametros();
			this.ddbb = params.database;
			this.licencia = params.licencia;
		} catch (error) {
			console.error('Error al obtener los parámetros', error);
			throw error;
		}
	}

	private checkTaxpayer() {
		// TODO: Implementar esta función para comprobar si el taxpayer ya está creado
		return false;
	}

	private checkSigner() {
		// TODO: Implementar esta función para comprobar si el signer ya está creado
		return false;
	}

	private checkClient() {
		// TODO: Implementar esta función para comprobar si el client ya está creado
		return false;
	}

	private async setSigner() {
		if (!this.checkProperties()) return;
		if (this.checkSigner()) return;

		const uuid = UtilesModule.generateUuid();

		// En vez de pasarle un objeto vacío, se le puede
		// pasar un objeto con los metadatos que se quieran
		// Tienen que seguir esta estructura:
		// { key: value, key2: value2, ... }
		// Donde key es lo que se quiere guardar y value es el valor (string)
		// Hay un máximo de 20 metadatos por signer
		try {
			await this.axiosClient.put(
				`signers/${uuid}`,
				{ metadata: { test: 'test' } },
				{
					headers: {
						Authorization: `Bearer ${this.accessToken.bearer}`,
					},
				}
			);

			// Si la petición se ha hecho correctamente, seteamos el signer
			// ya que el uuid que se ha generado es el id que se ha creado
			this.signer = uuid;
		} catch (error) {
			console.error('Error al crear el signer', error.response.data);
			throw error;
		}
	}

	private async setClient() {
		if (!this.signer) throw new Error('No se ha creado el signer');
		if (!this.checkProperties()) return;
		if (this.checkClient()) return;

		const uuid = UtilesModule.generateUuid();
		// A este objeto también se le pueden pasar metadatos
		const data = {
			content: {
				signer_id: this.signer,
			},
		};

		try {
			await this.axiosClient.put(`clients/${uuid}`, data, {
				headers: {
					Authorization: `Bearer ${this.accessToken.bearer}`,
				},
			});

			// Si la petición se ha hecho correctamente, seteamos el client
			// ya que el uuid que se ha generado es el id que se ha creado
			this.client = uuid;
		} catch (error) {
			console.error('Error al crear el client', error);
			throw error;
		}
	}

	// ? No se si es necesario hacer esta función
	// private async setTaxpayer() {
	//     if(!this.checkProperties()) return;
	//     if(this.checkTaxpayer()) return;

	//     const data = {
	//         content: {
	//             issuer: {
	//                 legal_name: "Test",
	//                 tax_number: "12345678A",
	//             },
	//             territory: "GIPUZKOA",
	//         }
	//     };

	//     try {
	//         const response = await this.axiosClient.put('taxpayer', data, {
	//             headers: {
	//                 Authorization: `Bearer ${this.accessToken.bearer}`,
	//             },
	//         });
	//         console.log(response.data);
	//     } catch (error) {
	//         console.error('Error al crear el contribuyente', error);
	//         throw error;
	//     }
	// }
}
