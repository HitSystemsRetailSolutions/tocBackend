import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import axios from "axios";
import { parametrosInstance } from "./parametros/parametros.clase";
import { logger } from "./logger";
import { url } from "inspector";
import { mqttInstance } from "./mqtt";
var ip = require("ip");
require("./sincro");
require("./sockets.gateway");

axios.defaults.baseURL =
  process.env.npm_lifecycle_event === "start:dev"
    ? "http://localhost:3001"
    : "https://santaana2-elb.nubehit.com:3002";

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

async function bootstrap(ip, port) {
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
  await app.listen(port, ip);
  // await app.listen(3000,"10.137.0.201"); //para iterum ubuntu
  // await app.listen(3000,"10.137.0.243"); //para iterum windows
}

bootstrap("localhost", 3000);
bootstrap(ip.address(), 3000);

// mandamos el logo a la impresora de tickets por si la impresora estaba encendida de antes
mqttInstance.mandarLogo();

