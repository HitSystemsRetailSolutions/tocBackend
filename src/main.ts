import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import axios from "axios";
import { parametrosInstance } from "./parametros/parametros.clase";
import { logger } from "./logger";
require("./sincro");
require("./sockets.gateway");
var ip = require("ip");
let URL_SANPEDRO = "";
if (process.env.npm_lifecycle_event === "start:dev")
  URL_SANPEDRO = "http://localhost:3001";
else URL_SANPEDRO = "https://sanpedro.cloud";
axios.defaults.baseURL = URL_SANPEDRO;

parametrosInstance
  .getParametros()
  .then((parametros) => {
    if (parametros && parametros.token) {
      axios.defaults.headers.common["Authorization"] = parametros.token;
    } else {
      throw Error("Error, parametros incorrectos en main");
    }
  })
  .catch((err) => {
    logger.Error(125, err);
  });

async function bootstrap(ip) {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      cors: {
        origin: true,
        credentials: true,
      },
    }
    
  );
  
  // app.enableCors();
  // await app.listen(3000);
  await app.listen(3000,ip); //para iterum ubuntu
  // await app.listen(3000,"10.137.0.243"); //para iterum windows
}
bootstrap(ip.address());
bootstrap("localhost");