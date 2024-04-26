import { Controller, Post, Body, Query, Param } from "@nestjs/common";
const mqtt = require("mqtt");
const mqttOptions = {
  host: process.env.MQTT_HOST,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
};
const client = mqtt.connect(mqttOptions);
import { parametrosController } from "src/parametros/parametros.controller";
import { io } from "../sockets.gateway";
import * as schContable from "./contable.mongodb";

//--------------------------------------------------------------
client.on("connect", async () => {
  console.log("Conectado a MQTT"+ client.connected);
  const parametros = await parametrosController.getParametros();
  try {
    client.subscribe(`/Hit/Serveis/Contable/Estock/${parametros.licencia}`);
  } catch (error) {
    console.log(
      "error en contable.controller parametros o direccion no encontrados: ",
      error.message
    );
  }
});

client.on("error", (err) => {
  console.error("Error en el client MQTT:", err);
});

client.on("message", async (topic, message) => {
  try {
    const parametros = await parametrosController.getParametros();
    message = JSON.parse(message.toString());
    if (
      message &&
      message.articleCodi &&
      message.EstocActualitzat &&
      message.FontSize &&
      message.FontColor &&
      message.Llicencia == parametros.licencia
    ) {
      let item = message.articleCodi;
      let stock = message.EstocActualitzat;
      let fontSize = message.FontSize;
      let fontColor = message.FontColor;
      try {
        //schContable.setItemStock(Number(item), Number(stock));
        io.emit("stock", { item, stock, fontSize, fontColor });
      } catch (error) {
        console.log(
          "error en contable.controller > setItemStock: ",
          error.message
        );
      }
    } else {
      console.log("error en contable.controller > message: ", message);
    }
  } catch (error) {
    console.log(
      "error en contable.controller > client.on(message): ",
      error.message
    );
  }
});
//--------------------------------------------------------------

@Controller("/contable/")
export class contableController {}
