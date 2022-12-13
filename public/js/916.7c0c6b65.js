"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[916],{7767:function(a,e,t){t.d(e,{Z:function(){return v}});var o=t(3396);const n={class:"btn-group-vertical mt-1"},l={class:"btn-group"},s={class:"btn-group"},c={class:"btn-group"},i={class:"btn-group"},r={class:"btn-group"};function u(a,e,t,u,d,m){return(0,o.wg)(),(0,o.iD)("div",n,[(0,o._)("div",l,[(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[0]||(e[0]=a=>u.addTecla("1"))}," 1 "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[1]||(e[1]=a=>u.addTecla("2"))}," 2 "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[2]||(e[2]=a=>u.addTecla("3"))}," 3 ")]),(0,o._)("div",s,[(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[3]||(e[3]=a=>u.addTecla("4"))}," 4 "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[4]||(e[4]=a=>u.addTecla("5"))}," 5 "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[5]||(e[5]=a=>u.addTecla("6"))}," 6 ")]),(0,o._)("div",c,[(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[6]||(e[6]=a=>u.addTecla("7"))}," 7 "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[7]||(e[7]=a=>u.addTecla("8"))}," 8 "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[8]||(e[8]=a=>u.addTecla("9"))}," 9 ")]),(0,o._)("div",i,[(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[9]||(e[9]=a=>u.deleteTecla())}," < "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[10]||(e[10]=a=>u.addTecla("0"))}," 0 "),(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:e[11]||(e[11]=a=>u.okValue(Number(u.cantidad)))}," OK ")]),(0,o._)("div",r,[(0,o._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonComa",onClick:e[12]||(e[12]=a=>u.addTecla("."))}," , ")])])}var d=t(4870),m={name:"NumpadComponent",setup(a,{expose:e}){const t=(0,d.iH)("0"),n=(0,o.f3)("okValue"),l=(0,d.iH)("5.5rem"),s=(0,d.iH)("5.5rem");function c(a){"."===a&&(t.value=t.value.replace(".","")),t.value+=a,"0"==t.value[0]&&(t.value=t.value.slice(1))}function i(){t.value=t.value.slice(0,-1),""===t.value&&(t.value="0")}function r(a){t.value=a.toString()}return e({cantidad:t,setValor:r}),{okValue:n,cantidad:t,addTecla:c,deleteTecla:i,setValor:r,anchoTecla:l,altoTecla:s}}},p=t(89);const b=(0,p.Z)(m,[["render",u],["__scopeId","data-v-6bb950cc"]]);var v=b},9741:function(a,e,t){t.d(e,{Z:function(){return u}});var o=t(3396);const n={class:"input-group position-absolute bottom-0 start-0"};function l(a,e,t,l,s,c){return(0,o.wg)(),(0,o.iD)("div",n,[(0,o._)("button",{onClick:e[0]||(e[0]=a=>l.volver()),class:"btn btn-warning ms-2",style:{"font-size":"27px"}}," VOLVER ")])}var s=t(9351),c={name:"VolverComponent",setup(){function a(){s.Z.back()}return{volver:a}}},i=t(89);const r=(0,i.Z)(c,[["render",l]]);var u=r},916:function(a,e,t){t.r(e),t.d(e,{default:function(){return G}});var o=t(3396);const n=a=>((0,o.dD)("data-v-c0bc6c54"),a=a(),(0,o.Cn)(),a),l={class:"row"},s={class:"row mt-4"},c={class:"col"},i=n((()=>(0,o._)("img",{src:"img/img-efectivo.png",width:"300",alt:"Seleccionar efectivo"},null,-1))),r={class:"col"},u=n((()=>(0,o._)("img",{src:"img/img-tkrs.png",width:"300",alt:"Seleccionar pago con ticket restaurante"},null,-1))),d={class:"col"},m=n((()=>(0,o._)("img",{src:"img/img-tarjetas.png",width:"300",alt:"Seleccionar pago con tarjeta"},null,-1))),p={class:"position-absolute bottom-0 end-0"};function b(a,e,t,n,b,v){const g=(0,o.up)("CambioComponent"),k=(0,o.up)("MDBIcon"),_=(0,o.up)("MDBCardText"),f=(0,o.up)("MDBCardBody"),C=(0,o.up)("MDBCard"),T=(0,o.up)("ModalTkrsComponent"),y=(0,o.up)("VolverComponent"),w=(0,o.up)("MDBBtn");return(0,o.wg)(),(0,o.iD)(o.HY,null,[(0,o._)("div",l,[(0,o.Wm)(g,{ref:"cambioRef"},null,512)]),(0,o._)("div",s,[(0,o._)("div",c,[(0,o.Wm)(C,{class:"cardTicketRestaurante text-center",onClick:e[0]||(e[0]=a=>n.setFormaPago("EFECTIVO"))},{default:(0,o.w5)((()=>[(0,o.Wm)(f,null,{default:(0,o.w5)((()=>[(0,o.Wm)(_,null,{default:(0,o.w5)((()=>[i,"EFECTIVO"===n.formaPago?((0,o.wg)(),(0,o.j4)(k,{key:0,class:"mt-4",icon:"hand-pointer",size:"5x"})):(0,o.kq)("",!0)])),_:1})])),_:1})])),_:1})]),(0,o._)("div",r,[n.modalTkrsRef?((0,o.wg)(),(0,o.j4)(C,{key:0,class:"cardTicketRestaurante text-center",onClick:e[1]||(e[1]=a=>n.modalTkrsRef.abrirModal())},{default:(0,o.w5)((()=>[(0,o.Wm)(f,null,{default:(0,o.w5)((()=>[(0,o.Wm)(_,null,{default:(0,o.w5)((()=>[u,"TKRS"===n.formaPago?((0,o.wg)(),(0,o.j4)(k,{key:0,class:"mt-4",icon:"hand-pointer",size:"5x"})):(0,o.kq)("",!0)])),_:1})])),_:1})])),_:1})):(0,o.kq)("",!0)]),(0,o._)("div",d,[(0,o.Wm)(C,{class:"cardTicketRestaurante text-center",onClick:e[2]||(e[2]=a=>n.setFormaPago("TARJETA"))},{default:(0,o.w5)((()=>[(0,o.Wm)(f,null,{default:(0,o.w5)((()=>[(0,o.Wm)(_,null,{default:(0,o.w5)((()=>[m,"TARJETA"===n.formaPago?((0,o.wg)(),(0,o.j4)(k,{key:0,class:"mt-4",icon:"hand-pointer",size:"5x"})):(0,o.kq)("",!0)])),_:1})])),_:1})])),_:1})])]),(0,o.Wm)(T,{ref:"modalTkrsRef"},null,512),(0,o.Wm)(y),(0,o._)("div",p,[(0,o.Wm)(w,{class:"botonCobrar",color:"primary",onClick:e[3]||(e[3]=a=>n.cobrar())},{default:(0,o.w5)((()=>[(0,o.Uk)("Pagar")])),_:1})])],64)}t(7658);var v=t(4870),g=t(7139);const k={class:"row mt-2"},_={class:"col-md-3"},f={key:0,class:"sizeLetrasCambio"},C={class:"sizeLetrasCambio"},T={key:1,class:"estiloFalta sizeLetrasCambio"},y={key:2,class:"estiloPerfecto sizeLetrasCambio"},w={key:3,class:"estiloSobra sizeLetrasCambio"},M={class:"col-md-9"},B={class:"row"},D={class:"col text-end"},z={class:"row mt-2"},R={class:"col text-end"};function E(a,e,t,n,l,s){const c=(0,o.up)("MDBCardTitle"),i=(0,o.up)("MDBCardText"),r=(0,o.up)("MDBBtn"),u=(0,o.up)("MDBCardBody"),d=(0,o.up)("MDBCard");return(0,o.wg)(),(0,o.iD)("div",k,[(0,o._)("div",_,[(0,o.Wm)(d,{class:"cardInfoCambio"},{default:(0,o.w5)((()=>[(0,o.Wm)(u,null,{default:(0,o.w5)((()=>[(0,o.Wm)(c,null,{default:(0,o.w5)((()=>[(0,o.Uk)("Información cambio")])),_:1}),(0,o.Wm)(i,null,{default:(0,o.w5)((()=>[null!=n.cantidadTkrs&&void 0!=n.cantidadTkrs?((0,o.wg)(),(0,o.iD)("li",f," Dinero recibido: "+(0,g.zw)(Number(n.totalRecibido+n.cantidadTkrs).toFixed(2))+" € ",1)):(0,o.kq)("",!0),(0,o._)("li",C,"Dinero a pagar: "+(0,g.zw)(n.aPagar),1),null!=n.cuenta&&void 0!=n.cuenta&&n.cuenta>0?((0,o.wg)(),(0,o.iD)("li",T," Faltan "+(0,g.zw)(n.cuenta.toFixed(2))+" € ",1)):(0,o.kq)("",!0),null!=n.cuenta&&void 0!=n.cuenta&&0==n.cuenta?((0,o.wg)(),(0,o.iD)("li",y," Cambio perfecto ")):(0,o.kq)("",!0),null!=n.cuenta&&void 0!=n.cuenta&&n.cuenta<0?((0,o.wg)(),(0,o.iD)("li",w," Sobran "+(0,g.zw)((n.aPagar-n.totalRecibido).toFixed(2))+" € ",1)):(0,o.kq)("",!0)])),_:1}),(0,o.Wm)(r,{size:"lg",color:"warning",onClick:e[0]||(e[0]=a=>n.deshacer()),class:"sizeBotones"},{default:(0,o.w5)((()=>[(0,o.Uk)("Deshacer")])),_:1}),(0,o.Wm)(r,{size:"lg",color:"danger",class:"sizeBotones",onClick:e[1]||(e[1]=a=>n.limpiar())},{default:(0,o.w5)((()=>[(0,o.Uk)("Limpiar")])),_:1})])),_:1})])),_:1})]),(0,o._)("div",M,[(0,o._)("div",B,[(0,o._)("div",D,[(0,o._)("img",{src:"/img/1cts.png",class:"sizeMonedas",onClick:e[2]||(e[2]=a=>n.sumar(.01))}),(0,o._)("img",{src:"/img/2cts.png",class:"sizeMonedas",onClick:e[3]||(e[3]=a=>n.sumar(.02))}),(0,o._)("img",{src:"/img/5cts.png",class:"sizeMonedas",onClick:e[4]||(e[4]=a=>n.sumar(.05))}),(0,o._)("img",{src:"/img/10cts.png",class:"sizeMonedas",onClick:e[5]||(e[5]=a=>n.sumar(.1))}),(0,o._)("img",{src:"/img/20cts.png",class:"sizeMonedas",onClick:e[6]||(e[6]=a=>n.sumar(.2))}),(0,o._)("img",{src:"/img/50cts.png",class:"sizeMonedas",onClick:e[7]||(e[7]=a=>n.sumar(.5))}),(0,o._)("img",{src:"/img/uneuro.png",class:"sizeMonedas",onClick:e[8]||(e[8]=a=>n.sumar(1))}),(0,o._)("img",{src:"/img/doseuros.png",class:"sizeMonedas",onClick:e[9]||(e[9]=a=>n.sumar(2))})])]),(0,o._)("div",z,[(0,o._)("div",R,[(0,o._)("img",{src:"/img/5euros.png",class:"sizeBilletes",onClick:e[10]||(e[10]=a=>n.sumar(5))}),(0,o._)("img",{src:"/img/10euros.png",class:"sizeBilletes",onClick:e[11]||(e[11]=a=>n.sumar(10))}),(0,o._)("img",{src:"/img/20euros.png",class:"sizeBilletes",onClick:e[12]||(e[12]=a=>n.sumar(20))}),(0,o._)("img",{src:"/img/50euros.png",class:"sizeBilletes",onClick:e[13]||(e[13]=a=>n.sumar(50))}),(0,o._)("img",{src:"/img/100euros.png",class:"sizeBilletes",onClick:e[14]||(e[14]=a=>n.sumar(100))}),(0,o._)("img",{src:"/img/200euros.png",class:"sizeBilletes",onClick:e[15]||(e[15]=a=>n.sumar(200))}),(0,o._)("img",{src:"/img/500euros.png",class:"sizeBilletes",onClick:e[16]||(e[16]=a=>n.sumar(500))})])])])])}var W=t(4313),x={name:"CambioComponent",components:{MDBCard:W.Yl,MDBCardBody:W.H7,MDBCardTitle:W.QM,MDBCardText:W.Pp,MDBBtn:W.$v},setup(a,{expose:e}){const t=(0,v.iH)(0),n=(0,o.f3)("total"),l=(0,v.iH)(n),s=(0,v.iH)([]),c=(0,v.iH)(0),i=(0,o.Fl)((()=>l.value-c.value<0?0:l.value-(t.value+c.value)));function r(a){console.log(t.value,a,c.value),t.value+=a,s.value.push(a)}function u(){s.value.pop();let a=0;s.value.forEach((e=>{a+=e})),t.value=a}function d(){t.value=0,s.value=[]}function m(a){c.value=Number(a)}return e({setTkrs:m}),{sumar:r,totalRecibido:t,aPagar:l,deshacer:u,limpiar:d,cantidadTkrs:c,cuenta:i}}},h=t(89);const N=(0,h.Z)(x,[["render",E],["__scopeId","data-v-15330504"]]);var V=N,F=t(9741);const P={class:"row"},H={key:0,class:"cantidad text-center"},I={class:"row mt-2"},j={class:"col text-center"};function A(a,e,t,n,l,s){const c=(0,o.up)("MDBModalTitle"),i=(0,o.up)("MDBModalHeader"),r=(0,o.up)("NumpadComponent"),u=(0,o.up)("MDBModalBody"),d=(0,o.up)("MDBBtn"),m=(0,o.up)("MDBModalFooter"),p=(0,o.up)("MDBModal");return(0,o.wg)(),(0,o.j4)(p,{id:"modalTkrs",tabindex:"-1",labelledby:"modalTkrsLabel",modelValue:n.modalTkrs,"onUpdate:modelValue":e[1]||(e[1]=a=>n.modalTkrs=a)},{default:(0,o.w5)((()=>[(0,o.Wm)(i,null,{default:(0,o.w5)((()=>[(0,o.Wm)(c,{id:"modalTkrsLabel"},{default:(0,o.w5)((()=>[(0,o.Uk)(" Introduce la cantidad del Tiquet Restaurant ")])),_:1})])),_:1}),(0,o.Wm)(u,null,{default:(0,o.w5)((()=>[(0,o._)("div",P,[n.numPadRef?((0,o.wg)(),(0,o.iD)("span",H,(0,g.zw)(n.numPadRef.cantidad),1)):(0,o.kq)("",!0)]),(0,o._)("div",I,[(0,o._)("div",j,[(0,o.Wm)(r,{ref:"numPadRef"},null,512)])])])),_:1}),(0,o.Wm)(m,null,{default:(0,o.w5)((()=>[(0,o.Wm)(d,{color:"danger",size:"lg",onClick:e[0]||(e[0]=a=>n.modalTkrs=!1)},{default:(0,o.w5)((()=>[(0,o.Uk)("Cerrar")])),_:1})])),_:1})])),_:1},8,["modelValue"])}var J=t(7767),Z={name:"ModalTkrsComponent",components:{MDBModal:W.j3,MDBModalHeader:W.ol,MDBModalTitle:W.wo,MDBModalBody:W.Yz,MDBModalFooter:W.ab,MDBBtn:W.$v,NumpadComponent:J.Z},setup(a,{expose:e}){const t=(0,v.iH)(!1),n=(0,v.iH)(null),l=(0,o.f3)("setTkrs");function s(){t.value=!0}function c(){t.value=!1,l(n.value.cantidad)}return(0,o.JJ)("okValue",c),e({abrirModal:s}),{modalTkrs:t,numPadRef:n,okValue:c}}};const q=(0,h.Z)(Z,[["render",A],["__scopeId","data-v-923e4868"]]);var L=q,O=t(2492),S=t.n(O),U=t(70),Y=t(65),K=t(2483),$={name:"CobroView",components:{CambioComponent:V,MDBCard:W.Yl,MDBBtn:W.$v,MDBCardBody:W.H7,MDBCardText:W.Pp,VolverComponent:F.Z,ModalTkrsComponent:L,MDBIcon:W.vm},setup(){const a=(0,Y.oR)(),e=(0,K.tv)(),t=(0,v.iH)("TARJETA"),n=(0,v.iH)(null),l=(0,v.iH)(null),s=(0,v.iH)(0),c=(0,o.Fl)((()=>a.state.Trabajadores.indexActivo)),i=(0,o.Fl)((()=>a.state.Trabajadores.arrayTrabajadores)),r=(0,o.Fl)((()=>a.state.Cestas.arrayCestas)),u=(0,o.Fl)((()=>i.value&&void 0!=c.value&&null!=c.value&&i.value[c.value]?i.value[c.value]:null)),d=(0,o.Fl)((()=>{if(r.value)for(let a=0;a<r.value.length;a++)if(r.value[a]._id==i.value[c.value].idCesta)return r.value[a];return null}));function m(a){s.value=Number(a),l.value.setTkrs(a),a>=g(d.value)?t.value="TKRS":t.value="EFECTIVO"}function p(a){s.value<g(d.value)?"TARJETA"===a&&s.value>0?S().fire("Oops...","De momento el Ticket Restaurant solo se puede combinar con EFECTIVO","error"):t.value=a:S().fire("¡Eo!","El ticket resturant ya cubre el total de la venta","error")}async function b(){try{const o=await U.Z.post("tickets/crearTicket",{total:g(d.value),idCesta:d.value._id,idTrabajador:u.value._id,tipo:t.value,tkrsData:{cantidadTkrs:s.value,formaPago:"EFECTIVO"}});if(!o.data)throw Error("No se ha podido crear el ticket");S().fire({icon:"success",title:"Venta registrada correctamente",showConfirmButton:!1,timer:1200}),"TARJETA"===t.value&&a.dispatch("Datafono/setEstado","PENDIENTE"),e.push("/main")}catch(o){S().fire("Oops...",o.message,"error")}}function g(a){return a.detalleIva.importe1+a.detalleIva.importe2+a.detalleIva.importe3}return(0,o.JJ)("total",g(d.value)),(0,o.JJ)("setTkrs",m),{cesta:d,getTotal:g,cobrar:b,formaPago:t,modalTkrsRef:n,cambioRef:l,setFormaPago:p}}};const Q=(0,h.Z)($,[["render",b],["__scopeId","data-v-c0bc6c54"]]);var G=Q}}]);
//# sourceMappingURL=916.7c0c6b65.js.map