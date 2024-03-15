import * as schPantallManager from "./pantallaManager.mongodb";

export class pantallaManager {
  async getInfoScreen(id: number) {
    let sc = await schPantallManager.getScreen();
    return sc.find((s) => s.id == id);
  }

  screensChanged(mg, db) {
    if (!mg) return true;

    if (mg.length != db.length) return true;
    for (let i = 0; i < mg.length; i++) {
      if (mg[i].id != db[i].id) return true;
      if (mg[i].name != db[i].name) return true;
    }
    return false;
  }
}
const pantallaInstance = new pantallaManager();

export { pantallaInstance };
