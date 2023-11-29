import { Controller, Post, Body, Query, Param } from "@nestjs/common";
import { io } from "../sockets.gateway";
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");
client.on("connect", async () => {
  try {
    client.subscribe(`hit/hardware/pes`);
  } catch (error) {
    console.log(
      "error en balanca.controller parametros o direccion no encontrados: ",
      error.message
    );
  }
});

client.on("message", (topic, message) => {
  io.emit("setBalanzaValue", Number(message.toString()) * 1000);
});
@Controller("/balanca/")
export class balancaController {}
