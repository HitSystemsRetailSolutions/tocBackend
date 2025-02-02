import { Body, Controller, Get, Post, Param, Req, Res, Next } from "@nestjs/common";
import { cashlogyInstance } from "./cashlogy.clase";
import { logger } from "../logger";
  

@Controller("cashlogy")
export class CashlogyController {

  @Get("activado")
  activado() {
    return cashlogyInstance.activado()
  }
  
  @Post("saveGrupoProcesos")
  saveGrupoProcesos(@Body() { grupo, info }) {
    return cashlogyInstance.saveGrupoProcesos(grupo, info)
  }
  @Get("get_procesoPrevioInterrumpido")
  get_procesoPrevioInterrumpido() {
    return cashlogyInstance.get_procesoPrevioInterrumpido()
  }
  @Post("aceptar_procesoPrevioInterrumpido")
  aceptar_procesoPrevioInterrumpido(@Body() data) {
    return cashlogyInstance.aceptar_procesoPrevioInterrumpido(data)
  }

  @Get("aceptar_reset_remoto")
  aceptar_reset_remoto() {
    cashlogyInstance.aceptar_reset_remoto()
  }

  @Post("importe_entrado_manualmente_en_cobrar")
  importe_entrado_manualmente_en_cobrar(@Body() importe) {
    cashlogyInstance.importe_entrado_manualmente_en_cobrar = importe
  }

  @Post("cobrar")
  cobrar(@Body() { importe_a_cobrar, auto_aceptar } ) {
    return cashlogyInstance.cobrar(importe_a_cobrar, auto_aceptar)
  }
  @Post("anadir_cambios_y_devolver")
  anadir_cambios_y_devolver(@Body() importe) {
    return cashlogyInstance.anadir_cambios_y_devolver(importe)
  }
  @Get("anadir_cambios")
  anadir_cambios() {
    return cashlogyInstance.anadir_cambios()
  }
  @Post("solo_dispensar")
  solo_dispensar(@Body() importe) {
    return cashlogyInstance.solo_dispensar(importe)
  }
  @Get("dar_cambio_entrada")
  dar_cambio_entrada() {
    return cashlogyInstance.dar_cambio_entrada() 
  }
/*  @Post("dar_cambio_fase2")
  dar_cambio_fase2(@Body() { importe_introducido, cantidad_cambio_pd }) {
    return cashlogyInstance.dar_cambio_fase2(importe_introducido, cantidad_cambio_pd )
  }
*/  
/*  @Post("retirar_efectivo")
  retirar_efectivo(@Body() { cantidad_retirar_pd, destino_billetes }) {
    return cashlogyInstance.retirar_efectivo(cantidad_retirar_pd, destino_billetes)
  }
*/
  @Post("dispensar_por_denominacion")
  dispensar_por_denominacion(@Body() { cantidad_retirar_pd, destino_billetes }) {
    return cashlogyInstance.dispensar_por_denominacion(cantidad_retirar_pd, destino_billetes)
  }
  @Post("vaciado_completo")
  vaciado_completo(@Body() { solo_monedas, denominaciones_vaciar, destino_billetes}) {
    return cashlogyInstance.vaciado_completo(solo_monedas, denominaciones_vaciar, destino_billetes)
  }
  @Post("consulta_todas_denominaciones")
  consulta_todas_denominaciones(@Body() incluir_efectivo_total) {
    return cashlogyInstance.consulta_todas_denominaciones(incluir_efectivo_total)
  }
  @Get("recaudar")
  recaudar() {
    return cashlogyInstance.recaudar()
  }
  @Post("mantenimiento")
  mantenimiento(@Body() tipo) {
    return cashlogyInstance.mantenimiento(tipo)
  } 
  /*
  @Post("mantenimiento_en_notificaciones")
  mantenimiento_en_notificaciones(@Body() tipo) {
    return cashlogyInstance.mantenimiento_en_notificaciones(tipo)
  }
    */
  @Get("poner_a_cero")
  poner_a_cero() {
    return cashlogyInstance.poner_a_cero()
  }
  @Get("resolver_incidencias")
  resolver_incidencias() {
    return cashlogyInstance.resolver_incidencias()
  }

  @Get("get_niveles")
  get_niveles() {
    return cashlogyInstance.get_niveles()
  }
  @Post("get_errores")
  get_errores(@Body() tipo) {
    return cashlogyInstance.get_errores(tipo)
  }
  @Get("get_estado")
  get_estado() {
    return cashlogyInstance.get_estado()
  }


  @Get(["imagen/*","video/*"])
  get_media(@Req() req, @Res() res ) {
    if (cashlogyInstance.proxy) 
      cashlogyInstance.proxy(req.raw ? req.raw : req, res.raw ? res.raw : res, () => { res.status(404).send("Not Found") })
    else res.status(404).send("Not Found")
  }

  @Get("refresh_notificaciones")
  refresh_notificaciones() {
    cashlogyInstance.refresh_notificaciones()
  }
  @Post("boton_pulsar")
  boton_pulsar(@Body() bot) {
    return cashlogyInstance.boton_pulsar(bot)
  }

  @Get("loadFondoCaja")
  loadFondoCaja() {
    return cashlogyInstance.loadFondoCajaDB()
  }
  @Post("saveFondoCaja")
  saveFondoCaja(@Body() fondoCaja) {
    cashlogyInstance.saveFondoCajaDB(fondoCaja)
  }

  @Post("reiniciar")
  reiniciar(@Body() check_finalizado) {
    cashlogyInstance.reiniciar(check_finalizado)
  }

  @Post("enviar_comando_conexion")
  enviar_comando_conexion(@Body() comando) {
    return cashlogyInstance.enviar_comando_conexion(comando)
  }

  @Get("do_stop_proceso_activo")
  do_stop_proceso_activo() {
    cashlogyInstance.do_stop_proceso_activo()
  }
}
