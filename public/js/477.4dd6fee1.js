"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[477],{477:function(a,e,o){o.r(e),o.d(e,{default:function(){return v}});var n=o(3396);const r={class:"row mt-1"},i={class:"row mt-1"};function c(a,e,o,c,t,s){const l=(0,n.up)("MDBBtn"),u=(0,n.up)("router-view");return(0,n.wg)(),(0,n.iD)(n.HY,null,[(0,n._)("div",r,[(0,n.Wm)(l,{outline:"dark",class:"opcionesPrincipales col",onClick:e[0]||(e[0]=a=>c.goTo("/menu/caja/tickets"))},{default:(0,n.w5)((()=>[(0,n.Uk)("Tickets")])),_:1}),(0,n.Wm)(l,{outline:"dark",class:"opcionesPrincipales col",onClick:e[1]||(e[1]=a=>c.goTo("/menu/caja/salidaDinero"))},{default:(0,n.w5)((()=>[(0,n.Uk)("Salida de dinero")])),_:1}),!1===c.NoEntradaDiners?((0,n.wg)(),(0,n.j4)(l,{key:0,outline:"dark",class:"opcionesPrincipales col",onClick:e[2]||(e[2]=a=>c.goTo("/menu/caja/entradaDinero"))},{default:(0,n.w5)((()=>[(0,n.Uk)("Entrada de dinero")])),_:1})):(0,n.kq)("",!0),(0,n.Wm)(l,{outline:"dark",class:"opcionesPrincipales col",onClick:e[3]||(e[3]=a=>c.goTo("/menu/caja/verUltimoCierre"))},{default:(0,n.w5)((()=>[(0,n.Uk)("Ver último cierre")])),_:1}),c.cajaAbierta?((0,n.wg)(),(0,n.j4)(l,{key:1,outline:"dark",class:"opcionesPrincipales col",onClick:e[4]||(e[4]=a=>c.goTo("/menu/caja/cerrarCaja"))},{default:(0,n.w5)((()=>[(0,n.Uk)("Cerrar caja")])),_:1})):((0,n.wg)(),(0,n.j4)(l,{key:2,outline:"dark",class:"opcionesPrincipales col",onClick:e[5]||(e[5]=a=>c.goTo("/abrirCaja"))},{default:(0,n.w5)((()=>[(0,n.Uk)("Abrir caja")])),_:1}))]),(0,n._)("div",i,[(0,n.Wm)(u)])],64)}o(7658);var t=o(70),s=o(4313),l=o(2492),u=o.n(l),d=o(4870),k=o(2483),p={name:"CajaView",components:{MDBBtn:s.$v},setup(){const a=(0,k.tv)(),e=(0,d.iH)(null),o=(0,d.iH)(!1);function r(e){a.push(e)}function i(){t.Z.get("caja/estadoCaja").then((a=>{e.value=a.data})).catch((a=>{u().fire("Oops...",a.message,"error")}))}return(0,n.bv)((()=>{i(),t.Z.post("parametros/getParametros").then((a=>{void 0!=a.data?.NoEntradaDiners?"Si"==a.data.NoEntradaDiners&&(o.value=!0):o.value=!1}))})),{goTo:r,cajaAbierta:e,NoEntradaDiners:o}}},m=o(89);const j=(0,m.Z)(p,[["render",c],["__scopeId","data-v-37bf882c"]]);var v=j}}]);
//# sourceMappingURL=477.4dd6fee1.js.map