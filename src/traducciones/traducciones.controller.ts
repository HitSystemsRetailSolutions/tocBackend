import { Body, Controller, Get, Post } from '@nestjs/common';
import { parametrosInstance } from 'src/parametros/parametros.clase';
import { logger } from '../logger';
import { traduccionesInstance } from './traducciones.clase';
@Controller('traducciones')
export class TraduccionesController {
    @Get('getTraducciones')
    async getTraducciones() {
        try {
            // Importante utilizar promesas en este caso para que el codigo no espere a seguir ejecutándose.
            // El código puede ejecutarse con normalidad aunque no estén las traducciones.
            // De esta manera liberamos carga y no hacemos esperar a las dependientas cada vez que se inice el tocGame.
            // Igualmente no debería tardar mucho, pero a la que las traducciones crezcan, puede que tarde más.
            // Esta función se llama cada vez que se hace F5 en la página o el tocGame se inicia.
            // Se podría modificar a que sólo se ejecute cuando se inicia y que también se ejecute si
            // se da click en algún boton del panel del técnico.
            return traduccionesInstance.getTraducciones();
        } catch (err) {
            logger.Error(50, err);
            return null;
        }
    }
    @Get('getIdioma')
    async getIdioma() {
        try {
            return traduccionesInstance.getIdioma();
        } catch (err) {
            logger.Error(50, err);
            return null;
        }
    }

    @Post('setTraduccionesKeys')
    async setTraduccionesKeys(@Body() data) {
        if(!data || !data.length)
            return {
                error: true,
                msg: 'El array viene vacío des del script.'
            }
        return await traduccionesInstance.setTraduccionesKeys(data)
    }
}
