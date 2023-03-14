import * as schMenus from "./menus.mongodb";
import { MenusInterface } from "./menus.interface";

export class MenusClase {
  private bloqueado: boolean;

  constructor() {
    this.bloqueado = false;
  }

  clickMenu(nombreMenu: string) {
    return schMenus.getTecladoMain(nombreMenu);
  }

  getBloqueado() {
    return this.bloqueado;
  }

  /* Eze 4.0 */
  getMenus = async () => await schMenus.getMenus();

  setBloqueado(x: boolean) {
    this.bloqueado = x;
  }

  /* Eze 4.0 */
  insertarMenus = async (arrayMenus: MenusInterface[]) =>
    await schMenus.insertarMenus(arrayMenus);

  getSubmenus(tag) {
    return schMenus.getSubmenus(tag);
  }
}

export const menusInstance = new MenusClase();
