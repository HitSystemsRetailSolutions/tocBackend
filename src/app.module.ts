import { Module } from "@nestjs/common";
import { ListadoVentasController } from "./listadoVentas/listadoVentas.controller";
import { ArticulosController } from "./articulos/articulos.controller";
import { TecladoController } from "./teclado/teclado.controller";
import { CestasController } from "./cestas/cestas.controller";
import { ParametrosController } from "./parametros/parametros.controller";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { TicketsController } from "./tickets/tickets.controller";
import { TrabajadoresController } from "./trabajadores/trabajadores.controller";
import { CajaController } from "./caja/caja.controller";
import { ClientesController } from "./clientes/clientes.controller";
import { ImpresoraController } from "./impresora/impresora.controller";
import { DevolucionesController } from "./devoluciones/devoluciones.controller";
import { MovimientosController } from "./movimientos/movimientos.controller";
import { PruebasController } from "./pruebas/pruebas.controller";
import { InstaladorController } from "./instalador/instalador.controller";
import { PaytefController } from "./paytef/paytef.controller";
import { VersionController } from "./version/version.controller";
import { TestController } from "./test/test.controller";
import { UtilesModule } from "./utiles/utiles.module";
import { ApagarController } from "./apagar/apagar.controller";
import { DoctorController } from "./doctor/doctor.controller";
import { SatelitesController } from "./satelites/satelites.controller";
import { TarifasController } from "./tarifas/tarifas.controller";
import { MesasController } from "./mesas/mesas.controller";
import { PromocionesController } from "./promociones/promociones.controller";
import { TraduccionesController } from "./traducciones/traducciones.controller";
import { EncargosController } from "./encargos/encargos.controller";
import { DeudasController } from "./deudas/deudas.controller";
import { CargarImagenController } from "./imagenInvasiva/imagen.controller";
import { CheckersController } from "./checkers/checkers.controller";
import { balancaController } from "./balanca/balanca.clase";
import { AlbaranesController } from "./albaranes/albaranes.controller";
import { contableController } from "./contable/contable.controller";
import { receiveItemsMQTTController } from "./receiveItemsMQTT/receiveItemsMQTT.controller";
import { TiposIvaController } from "./tiposIva/tiposIva.controller";
import { CashlogyController } from "./cashlogy/cashlogy.controller"


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"),
    }),
    UtilesModule,
  ],
  controllers: [
    ListadoVentasController,
    ArticulosController,
    TecladoController,
    CestasController,
    ParametrosController,
    TicketsController,
    ApagarController,
    TrabajadoresController,
    CajaController,
    ClientesController,
    ImpresoraController,
    contableController,
    DevolucionesController,
    MovimientosController,
    PruebasController,
    receiveItemsMQTTController,
    InstaladorController,
    PaytefController,
    VersionController,
    TestController,
    DoctorController,
    SatelitesController,
    TarifasController,
    MesasController,
    PromocionesController,
    balancaController,
    TraduccionesController,
    EncargosController,
    CheckersController,
    DeudasController,
    CargarImagenController,
    AlbaranesController,
    TiposIvaController,
    CashlogyController,
  ],
  // providers: [SocketGateway],
})
export class AppModule { }
