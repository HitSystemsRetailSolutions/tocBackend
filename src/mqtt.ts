import axios from "axios";
import { archivosInstance } from "./archivos/archivos.clase";
import { parametrosInstance } from "./parametros/parametros.clase";

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

  public resetPapel() {
    client.publish("hit.hardware/resetPaper");
  }
  
  public async mandarLogo() {
    const logoMongo = await archivosInstance.getLogo();
    if (!logoMongo) {
      const parametros = await parametrosInstance.getParametros();
      axios
        .post("/archivo/getLogo", {
          database: parametros.database,
        })
        .then((res) => {
          if (!res.data) {
            throw new Error("No se pudo obtener la imagen");
          }
          const logo = res.data["logo"];
          const extension = res.data["extension"];

          archivosInstance.insertarArchivo("logo", extension, logo.toString());

          client.publish("hit.hardware/logo", JSON.stringify({ logo }));
          return true;
        })
        .catch((err) => {
          this.loggerMQTT(err.message);
          return false;
        });
      return;
    }
    const logo = logoMongo.archivo;
    client.publish("hit.hardware/logo", JSON.stringify({ logo }));
  }
}

export const mqttInstance = new Mqtt();
