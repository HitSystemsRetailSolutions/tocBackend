"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[52],{6052:function(e,r,a){a.r(r),a.d(r,{default:function(){return h}});var t=a(3396);const o={class:"row"},s=["src"];function n(e,r,a,n,i,u){return(0,t.wg)(),(0,t.iD)("div",o,[(0,t._)("iframe",{src:n.url,style:{position:"absolute",height:"90%",width:"100%",border:"none"}},null,8,s)])}var i=a(4161),u=a(2492),l=a.n(u),c=a(4870),p={name:"PedidosComponent",setup(){const e=(0,c.iH)(null),r=(0,t.Fl)((()=>e.value?`http://silema.hiterp.com/TpvWeb.asp?Empresa=${e.value.database}&codiBotiga=${e.value.codigoTienda}`:null));return i.Z.post("parametros/getParametros").then((r=>{if(!r.data)throw Error("No se han podido obtener los parámetros");e.value=r.data})).catch((e=>{l().fire("Oops...",e.message,"error")})),{parametros:e,url:r}}},d=a(89);const m=(0,d.Z)(p,[["render",n]]);var h=m}}]);
//# sourceMappingURL=52.46983679.js.map