// import mqtt from "mqtt";
const mqtt = require("mqtt");
const client =
  mqtt.connect(process.env.MQTT_URL) || mqtt.connect("mqtt://localhost");

class Mqtt {
  public loggerMQTT(txt: string) {
    client.publish("hit.software/error", txt);
  }

  public enviarVisor(txt: string) {
    client.publish("hit.hardware/visor", txt);
  }

  public enviarImpresora(txt: string) {
    client.publish("hit.hardware/printer", txt);
  }
}

export const mqttInstance = new Mqtt();
