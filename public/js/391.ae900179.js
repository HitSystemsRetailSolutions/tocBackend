"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[391],{7391:function(a,e,n){n.r(e),n.d(e,{default:function(){return v}});var o=n(3396);const r={class:"row mt-1"},i={class:"row mt-1"};function t(a,e,n,t,c,s){const l=(0,o.up)("MDBBtn"),u=(0,o.up)("router-view");return(0,o.wg)(),(0,o.iD)(o.HY,null,[(0,o._)("div",r,[(0,o.Wm)(l,{outline:"dark",class:"opcionesPrincipales",onClick:e[0]||(e[0]=a=>t.goTo("/menu/caja/tickets"))},{default:(0,o.w5)((()=>[(0,o.Uk)("Tickets")])),_:1}),(0,o.Wm)(l,{outline:"dark",class:"opcionesPrincipales",onClick:e[1]||(e[1]=a=>t.goTo("/menu/caja/salidaDinero"))},{default:(0,o.w5)((()=>[(0,o.Uk)("Salida de dinero")])),_:1}),!1===t.NoEntradaDiners?((0,o.wg)(),(0,o.j4)(l,{key:0,outline:"dark",class:"opcionesPrincipales",onClick:e[2]||(e[2]=a=>t.goTo("/menu/caja/entradaDinero"))},{default:(0,o.w5)((()=>[(0,o.Uk)("Entrada de dinero")])),_:1})):(0,o.kq)("",!0),(0,o.Wm)(l,{outline:"dark",class:"opcionesPrincipales",onClick:e[3]||(e[3]=a=>t.goTo("/menu/caja/verUltimoCierre"))},{default:(0,o.w5)((()=>[(0,o.Uk)("Ver último cierre")])),_:1}),t.cajaAbierta?((0,o.wg)(),(0,o.j4)(l,{key:1,outline:"dark",class:"opcionesPrincipales",onClick:e[4]||(e[4]=a=>t.goTo("/menu/caja/cerrarCaja"))},{default:(0,o.w5)((()=>[(0,o.Uk)("Cerrar caja")])),_:1})):((0,o.wg)(),(0,o.j4)(l,{key:2,outline:"dark",class:"opcionesPrincipales",onClick:e[5]||(e[5]=a=>t.goTo("/abrirCaja"))},{default:(0,o.w5)((()=>[(0,o.Uk)("Abrir caja")])),_:1}))]),(0,o._)("div",i,[(0,o.Wm)(u)])],64)}n(7658);var c=n(70),s=n(4313),l=n(2492),u=n.n(l),d=n(4870),k=n(2483),p={name:"CajaView",components:{MDBBtn:s.$v},setup(){const a=(0,k.tv)(),e=(0,d.iH)(null),n=(0,d.iH)(!1);function r(e){a.push(e)}function i(){c.Z.get("caja/estadoCaja").then((a=>{e.value=a.data})).catch((a=>{u().fire("Oops...",a.message,"error")}))}return(0,o.bv)((()=>{i(),c.Z.post("parametros/getParametros").then((a=>{void 0!=a.data?.NoEntradaDiners?"Si"==a.data.NoEntradaDiners&&(n.value=!0):n.value=!1}))})),{goTo:r,cajaAbierta:e,NoEntradaDiners:n}}},m=n(89);const j=(0,m.Z)(p,[["render",t],["__scopeId","data-v-5e9ee122"]]);var v=j}}]);
//# sourceMappingURL=391.ae900179.js.map