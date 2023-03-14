import * as schSatelites from "./satelites.mongodb";
export class SatelitesClass {
  verifyToken(token: string) {
    return schSatelites.verifyToken(token).then((res) => {
      if (res) return true;
      return false;
    });
  }
}

export const satelitesInstance = new SatelitesClass();
