import { Controller, Post, Body, Query, Param } from "@nestjs/common";
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://63.33.116.171:1883");
import { parametrosController } from "src/parametros/parametros.controller";
import { io } from "../sockets.gateway";
import * as schContable from "./contable.mongodb";

//--------------------------------------------------------------
client.on("connect", async () => {
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

client.on("message", async (topic, message) => {
  const parametros = await parametrosController.getParametros();
  message = JSON.parse(message.toString());
  if (
    message &&
    message.CodiArticle &&
    message.EstocActualitzat
    // && message.Llicencia == parametros.licencia
  ) {
    let item = message.CodiArticle;
    let stock = message.EstocActualitzat;
    try {
      //schContable.setItemStock(Number(item), Number(stock));
      io.emit("stock", { item, stock });
    } catch (error) {
      console.log(
        "error en contable.controller > setItemStock: ",
        error.message
      );
    }
  }
});
//--------------------------------------------------------------

@Controller("/contable/")
export class contableController {}
