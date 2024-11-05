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
import { receiveItemsMQTTInstance } from "./receiveItemsMQTT.class";
require("dotenv").config();

//--------------------------------------------------------------
client.on("connect", async () => {
  console.log("Conectado a MQTT" + client.connected);
  const parametros = await parametrosController.getParametros();
  try {
    client.subscribe(`/Hit/Serveis/receiveItemsMQTT/${parametros.licencia}`);
  } catch (error) {
    console.log(
      "error en receiveItemsMQTT.controller parametros o direccion no encontrados: ",
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
      message.itemCode &&
      message.table &&
      message.Llicencia == parametros.licencia
    ) {
      let idItem = message.itemCode;
      let grams = message.grams;
      let table = message.mesa;
      let units = message.qty;
      let suplements = message.suplements
      try {
        receiveItemsMQTTInstance.addItemToTable(idItem, grams, table, units, suplements);
      } catch (error) {
        console.log(
          "error en receiveItemsMQTT.controller > setItemStock: ",
          error.message
        );
      }
    } else {
      console.log("error en receiveItemsMQTT.controller > message: ", message);
    }
  } catch (error) {
    console.log(
      "error en receiveItemsMQTT.controller > client.on(message): ",
      error.message
    );
  }
});
//--------------------------------------------------------------

@Controller("/receiveItemsMQTT/")
export class receiveItemsMQTTController { }
