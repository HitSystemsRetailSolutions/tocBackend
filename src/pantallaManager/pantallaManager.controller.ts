import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";
import * as schPantallManager from "./pantallaManager.mongodb";
@Controller("pantallaManager")
export class pantallaManager {
  @Post("downloadPantallasTienda")
  async downloadPantallasTienda(@Body() { codigoTienda }) {
    try {
      if (!codigoTienda) {
        return false;
      }
      const pantallas = await axios.post("pantallas/getPantallasTienda", {
        codigoTienda: codigoTienda,
      });
      let screens = JSON.parse(JSON.stringify(pantallas.data));
      let stp1 = await schPantallManager.setPantallas(screens);
      if (stp1) return screens;
      return false;
    } catch (error) {
      console.error("Error al obtener las pantallas de la tienda:", error);
    }
  }

  @Post("getPantallasTienda")
  async getPantallasTienda() {
    try {
      let screens = await schPantallManager.getScreen();
      if (screens) return screens;
      return false;
    } catch (error) {
      console.error("Error al obtener las pantallas de la tienda:", error);
    }
  }
}
