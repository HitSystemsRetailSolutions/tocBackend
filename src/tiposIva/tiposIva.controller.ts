import { tiposIvaInstance } from "./tiposIva.clase";
import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { logger } from "../logger";
import { parametrosInstance } from "../parametros/parametros.clase";

@Controller("tiposIva")
export class TiposIvaController {
  @Get("loadTypesOfIva")
  async loadTypesOfIva(@Query('forceToUpdate') forceToUpdate: boolean = false) {
    try {
      return await tiposIvaInstance.LoadTypesOfIVA(forceToUpdate);
    } catch (err) {
      logger.Error(233, "loadTypesIva: "+err);
    }
  }
}