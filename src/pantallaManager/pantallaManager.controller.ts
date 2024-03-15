import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";
import * as schPantallManager from "./pantallaManager.mongodb";
import { pantallaInstance } from "./pantallaManager.class";
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
      let dbScreens = JSON.parse(JSON.stringify(pantallas.data));
      let mgScreens = await schPantallManager.getScreen();
      let screens = mgScreens;
      if (pantallaInstance.screensChanged(mgScreens, dbScreens) || !mgScreens) {
        screens = dbScreens;
        await schPantallManager.setPantallas(screens);
      }
      if (screens) return screens;
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

  @Post("setScreenActive")
  async setScreen(@Body() { id }) {
    try {
      console.log(id);
      return await schPantallManager.setScreenInUse(id);
    } catch (error) {
      console.error("Error al obtener las pantallas de la tienda:", error);
    }
  }
}
