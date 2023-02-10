import axios from "axios";
import { menusInstance } from "../menus/menus.clase";
import { articulosInstance } from "../articulos/articulos.clase";
import { parametrosInstance } from "../parametros/parametros.clase";
import { nuevaInstancePromociones } from "../promociones/promociones.clase";
import * as schTeclas from "./teclado.mongodb";
import { logger } from "../logger";
import { TeclasInterface } from "./teclado.interface";

export class TecladoClase {
  /* Eze 4.0 */
  insertarTeclas = async (arrayTeclas: TeclasInterface[]) =>
    await schTeclas.insertarTeclas(arrayTeclas);

  /* Eze v23 */
  // async actualizarTeclado(): Promise<boolean> {
  //   try {
  //     const parametros = await parametrosInstance.getParametros();
  //     const res: any = await axios.post(
  //       "articulos/descargarArticulosEspeciales",
  //       {
  //         database: parametros.database,
  //         codigoCliente: parametros.codigoTienda,
  //       }
  //     );
  //     const resMenusSanPedro: any = await axios.post("menus/getMenus", {
  //       database: parametros.database,
  //       codigoTienda: parametros.codigoTienda,
  //     });
  //     const resMenus: any = await menusInstance.insertarMenus(
  //       resMenusSanPedro.data.info
  //     );
  //     const res2: any = await articulosInstance.insertarArticulos(
  //       res.data.info
  //     );

  //     const infoTeclados: any = await axios.post("/teclas/descargarTeclados", {
  //       database: parametros.database,
  //       licencia: parametros.codigoTienda,
  //     });
  //     if (await tecladoInstance.insertarTeclas(infoTeclados.data.info)) {
  //       const resPromociones: any = await axios.post(
  //         "promociones/getPromociones",
  //         {
  //           database: parametros.database,
  //           codigoTienda: parametros.codigoTienda,
  //         }
  //       );
  //       if (resPromociones.data.info.lenght > 0)
  //         return await nuevaInstancePromociones.insertarPromociones(
  //           resPromociones.data.info
  //         );
  //       return true;
  //     }
  //     return false;
  //   } catch (err) {
  //     logger.Error(103, err);
  //     return false;
  //   }
  // }

  /* Eze 4.0 */
  async actualizarTeclado(): Promise<boolean> {
    const articulos= await articulosInstance.descargarArticulos();
    if(articulos){
      const resTeclas: any = await axios.get("teclas/descargarTeclados");
      if (resTeclas.data) {
        if (resTeclas.data.length > 0) {
          return await this.insertarTeclas(resTeclas.data);
        }
      }
      throw Error("No se ha podido actualizar el teclado backend");
    }
  }

  async cambiarPosTecla(idArticle, nuevaPos, nombreMenu) {
    return await schTeclas.cambiarPosTecla(idArticle, nuevaPos, nombreMenu);
  }

  tienePrefijoSubmenu(x: string) {
    if (x.includes("]")) return true;
    return false;
  }

  getNombreMenu(stringCompleto: string) {
    const limpio = stringCompleto.slice(
      stringCompleto.indexOf("[") + 1,
      stringCompleto.lastIndexOf("]")
    );
    return limpio.trim();
  }

  getNombreSubmenu(stringCompleto: string) {
    const limpio = stringCompleto.slice(stringCompleto.indexOf("]") + 1);
    return limpio.trim();
  }

  addTeclaNormal(
    arrayMenus: any[],
    nombreNuevo: string,
    objTecla: any
  ): boolean {
    for (let i = 0; i < arrayMenus.length; i++) {
      if (arrayMenus[i].nombre == nombreNuevo) {
        arrayMenus[i].arrayTeclas.push(objTecla);
        return true;
      }
    }
    arrayMenus.push({
      nombre: nombreNuevo,
      arrayTeclas: [objTecla],
      arraySubmenus: null,
    });
    return true;
  }

  addTeclaConSubmenu(
    arrayMenus: any[],
    nombreNuevo: string,
    nombreNuevoSubmenu: string,
    objTecla: any
  ): boolean {
    let existeMenu = false;

    for (let i = 0; i < arrayMenus.length; i++) {
      if (arrayMenus[i].nombre == nombreNuevo) {
        existeMenu = true;
        let existeSubmenu = false;

        if (arrayMenus[i].arraySubmenus) {
          for (let j = 0; j < arrayMenus[i].arraySubmenus.length; j++) {
            if (arrayMenus[i].arraySubmenus[j].nombre == nombreNuevoSubmenu) {
              existeSubmenu = true;
              arrayMenus[i].arraySubmenus[j].arrayTeclas.push(objTecla);
              return true;
            }
          }
        } else {
          arrayMenus[i]["arraySubmenus"] = [];
        }

        if (!existeSubmenu) {
          arrayMenus[i].arraySubmenus.push({
            nombre: nombreNuevoSubmenu,
            arrayTeclas: [objTecla],
          });
          return true;
        }
        logger.Error(118, "Error, estado teclado desconocido");
        return false;
      }
    }

    if (!existeMenu) {
      arrayMenus.push({
        nombre: nombreNuevo,
        arraySubmenus: [
          { nombre: nombreNuevoSubmenu, arrayTeclas: [objTecla] },
        ],
      });
      return true;
    }

    logger.Error(119, "Error, estado teclado desconocido");
    return false;
  }

  async generarTecladoCompleto() {
    const teclas = await schTeclas.getTeclas();
    const menus = [];

    for (let i = 0; i < teclas.length; i++) {
      if (this.tienePrefijoSubmenu(teclas[i].nomMenu)) {
        this.addTeclaConSubmenu(
          menus,
          this.getNombreMenu(teclas[i].nomMenu),
          this.getNombreSubmenu(teclas[i].nomMenu),
          {
            idArticle: teclas[i].idArticle,
            nombreArticulo: teclas[i].nombreArticulo,
            pos: teclas[i].pos,
            color: teclas[i].color,
            esSumable: teclas[i].esSumable,
          }
        );
      } else {
        this.addTeclaNormal(menus, teclas[i].nomMenu.trim(), {
          idArticle: teclas[i].idArticle,
          nombreArticulo: teclas[i].nombreArticulo,
          pos: teclas[i].pos,
          color: teclas[i].color,
          esSumable: teclas[i].esSumable,
          suplementos: teclas[i].suplementos,
        });
      }
    }

    return menus.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
}
export const tecladoInstance = new TecladoClase();
