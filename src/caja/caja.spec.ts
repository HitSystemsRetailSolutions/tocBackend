import { ObjectId } from "mongodb";
import { CajaClase } from "./caja.clase";
import {
  CajaAbiertaInterface,
  CajaCerradaInterface,
  CajaSincro,
  MonedasInterface,
} from "./caja.interface";
import { conexion } from "../conexion/mongodb";

describe("Caja", () => {
  const cajaInstance = new CajaClase();

  it("getInfoCajaAbierta()", async () => {
    const cajaAbierta = await cajaInstance.getInfoCajaAbierta();

    expect(cajaAbierta.inicioTime).toBeDefined();
    expect(cajaAbierta.totalApertura).toBeDefined();
    expect(cajaAbierta.detalleApertura).toBeDefined();
    expect(cajaAbierta.idDependientaApertura).toBeDefined();
  });

  it("cajaAbierta()", async () => {
    const cajaAbierta = await cajaInstance.getInfoCajaAbierta();
    const resultado = await cajaInstance.cajaAbierta();
    if (cajaAbierta.inicioTime) {
      expect(resultado).toBeTruthy();
    } else {
      expect(resultado).toBeFalsy();
    }
  });

  it("confirmarCajaEnviada()", async () => {
    const cajaTest: CajaSincro = {
      _id: new ObjectId(),
      calaixFetZ: 0,
      descuadre: 0,
      detalleApertura: null,
      detalleCierre: null,
      enviado: false,
      finalTime: 654321,
      idDependientaApertura: null,
      idDependientaCierre: null,
      inicioTime: null,
      mediaTickets: null,
      nClientes: null,
      primerTicket: null,
      recaudado: null,
      totalApertura: null,
      totalCierre: null,
      totalDatafono3G: null,
      totalDeuda: null,
      totalEfectivo: null,
      totalEntradas: null,
      totalSalidas: null,
      totalTarjeta: null,
      totalTkrsConExceso: null,
      totalTkrsSinExceso: null,
      ultimoTicket: null,
    };
    const database = (await conexion).db("tocgame");
    const sincroCajas = database.collection<CajaSincro>("sincro-cajas");
    if ((await sincroCajas.insertOne(cajaTest)).acknowledged) {
      if (await cajaInstance.confirmarCajaEnviada(cajaTest._id)) {
        const getCaja = await sincroCajas.findOne({ _id: cajaTest._id });
        expect(getCaja.enviado).toBe(true);
      } else {
        throw Error("Error en el test confirmarCajaEnviada() Parte 2");
      }
    } else {
      throw Error("Error en el test confirmarCajaEnviada()");
    }
    await sincroCajas.deleteOne({ _id: cajaTest._id });
  });

  it("getCajaSincroMasAntigua()", async () => {
    const cajaTest: CajaSincro = {
      _id: new ObjectId(),
      calaixFetZ: 0,
      descuadre: 0,
      detalleApertura: null,
      detalleCierre: null,
      enviado: false,
      finalTime: 1917347506000, // 2030
      idDependientaApertura: null,
      idDependientaCierre: null,
      inicioTime: null,
      mediaTickets: null,
      nClientes: null,
      primerTicket: null,
      recaudado: null,
      totalApertura: null,
      totalCierre: null,
      totalDatafono3G: null,
      totalDeuda: null,
      totalEfectivo: null,
      totalEntradas: null,
      totalSalidas: null,
      totalTarjeta: null,
      totalTkrsConExceso: null,
      totalTkrsSinExceso: null,
      ultimoTicket: null,
    };
    const database = (await conexion).db("tocgame");
    const sincroCajas = database.collection<CajaSincro>("sincro-cajas");
    if ((await sincroCajas.insertOne(cajaTest)).acknowledged) {
      const getCaja = await sincroCajas.findOne({ _id: cajaTest._id });
      expect(getCaja.finalTime).toBe(cajaTest.finalTime);
    }
    await sincroCajas.deleteOne({ _id: cajaTest._id });
  });

  it("abrirCaja()", async () => {
    const database = (await conexion).db("tocgame");
    const caja = database.collection<CajaAbiertaInterface>("caja");
    if (
      (await caja.updateMany({}, { $set: { inicioTime: null } })).acknowledged
    ) {
      const cajaTest: CajaAbiertaInterface = {
        detalleApertura: [
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
          { valor: 1, unidades: 1, _id: "0.01" },
        ],
        idDependientaApertura: 1,
        inicioTime: 123456,
        totalApertura: 999,
      };
      if (await cajaInstance.abrirCaja(cajaTest)) {
        const getCajaAbierta = await caja.findOne();
        expect(getCajaAbierta.inicioTime).toBe(cajaTest.inicioTime);
      } else {
        throw Error("Error en test abrirCaja() parte 2");
      }
    } else {
      throw Error("Error en test abrirCaja() parte 1");
    }
  });

  it("guardarMonedas()", async () => {
    const objMonedas: MonedasInterface = {
      _id: "APERTURA",
      array: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    };

    if (await cajaInstance.guardarMonedas(objMonedas.array, objMonedas._id)) {
      const database = (await conexion).db("tocgame");
      const infoMonedas = database.collection<MonedasInterface>("infoMonedas");
      const getMonedas = await infoMonedas.findOne({ _id: "APERTURA" });
      expect(getMonedas.array[3]).toBe(50);
    } else {
      throw Error("Error en test guardarMonedas() parte 1");
    }
  });

  it("getMonedas()", async () => {
    const infoMonedas = await cajaInstance.getMonedas("APERTURA");
    expect(infoMonedas._id).toBeDefined();
    expect(infoMonedas.array.length).toBe(15);
  });

  it("nuevoItemSincroCajas()", async () => {
    const objCajaAbierta: CajaAbiertaInterface = {
      detalleApertura: null,
      idDependientaApertura: null,
      inicioTime: 159753,
      totalApertura: 94,
    };
    const objCajaCerrada: CajaCerradaInterface = {
      calaixFetZ: 15,
      descuadre: 0,
      detalleCierre: null,
      finalTime: 200000,
      idDependientaCierre: 1,
      mediaTickets: 20,
      nClientes: 50,
      primerTicket: 1,
      recaudado: 56,
      totalCierre: 60,
      totalDatafono3G: 0,
      totalDeuda: 0,
      totalEfectivo: 0,
      totalEntradas: 0,
      totalSalidas: 0,
      totalTarjeta: 0,
      totalTkrsConExceso: 0,
      totalTkrsSinExceso: 0,
      ultimoTicket: 2,
    };

    if (
      await cajaInstance.nuevoItemSincroCajas(objCajaAbierta, objCajaCerrada)
    ) {
      const database = (await conexion).db("tocgame");
      const sincroCajas = database.collection<CajaSincro>("sincro-cajas");
      const resultado = await sincroCajas
        .find()
        .sort({ _id: -1 })
        .limit(1)
        .toArray();

      expect(resultado[0].finalTime).toBe(200000);
      //await sincroCajas.deleteOne({_id: nuevoId});
    } else {
      throw Error("Error en test nuevoItemSincroCajas() parte 1");
    }
  });
})