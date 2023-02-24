"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[584],{9741:function(a,o,e){e.d(o,{Z:function(){return d}});var r=e(3396);const t={class:"input-group position-absolute bottom-0 start-0"};function l(a,o,e,l,s,i){return(0,r.wg)(),(0,r.iD)("div",t,[(0,r._)("button",{onClick:o[0]||(o[0]=a=>l.volver()),class:"btn btn-warning ms-2",style:{"font-size":"27px"}}," VOLVER ")])}var s=e(8686),i={name:"VolverComponent",setup(){function a(){s.Z.back()}return{volver:a}}},c=e(89);const n=(0,c.Z)(i,[["render",l]]);var d=n},584:function(a,o,e){e.r(o),e.d(o,{default:function(){return Q}});var r=e(3396);const t={class:"w-50 mx-auto"},l=(0,r._)("div",{class:"row mt-2"},null,-1),s={class:"row mt-2"},i={class:"row mt-2"},c={class:"row mt-2"},n={class:"row mt-2"},d={class:"row mt-2"},u={class:"row mt-2"},m={class:"row mt-2"},p={class:"row mt-2"},f={class:"row mt-2"},g={class:"row mt-2"},w={class:"row mt-2"};function v(a,o,e,v,_,k){const D=(0,r.up)("MDBBtn"),h=(0,r.up)("VolverComponent"),M=(0,r.up)("ModalConfigurador"),z=(0,r.up)("ModalImpresoraComponent"),B=(0,r.up)("ModalDatafonoComponent");return(0,r.wg)(),(0,r.iD)(r.HY,null,[(0,r._)("div",t,[l,(0,r._)("div",s,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[0]||(o[0]=a=>v.descargarClientesFinales())},{default:(0,r.w5)((()=>[(0,r.Uk)("Descargar clientes finales")])),_:1})]),(0,r._)("div",i,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[1]||(o[1]=a=>v.descargarTarifasEspeciales())},{default:(0,r.w5)((()=>[(0,r.Uk)("Descargar tarifas especiales")])),_:1})]),(0,r._)("div",c,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[2]||(o[2]=a=>v.actualizarParametros())},{default:(0,r.w5)((()=>[(0,r.Uk)("Actualizar parámetros tienda")])),_:1})]),(0,r._)("div",n,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[3]||(o[3]=a=>v.actualizarTrabajadores())},{default:(0,r.w5)((()=>[(0,r.Uk)("Actualizar trabajadores")])),_:1})]),(0,r._)("div",d,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[4]||(o[4]=a=>v.actualizarTeclados())},{default:(0,r.w5)((()=>[(0,r.Uk)("Actualizar teclado")])),_:1})]),(0,r._)("div",u,[v.modalImpresoraRef?((0,r.wg)(),(0,r.j4)(D,{key:0,color:"primary",size:"lg",class:"w-100",onClick:o[5]||(o[5]=a=>v.modalImpresoraRef.abrirModal())},{default:(0,r.w5)((()=>[(0,r.Uk)("Config. VID y PID impresora, Visor")])),_:1})):(0,r.kq)("",!0)]),(0,r._)("div",m,[v.modalDatafonoRef?((0,r.wg)(),(0,r.j4)(D,{key:0,color:"primary",size:"lg",class:"w-100",onClick:o[6]||(o[6]=a=>v.modalDatafonoRef.abrirModal())},{default:(0,r.w5)((()=>[(0,r.Uk)("Config. IP Paytef")])),_:1})):(0,r.kq)("",!0)]),(0,r._)("div",p,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[7]||(o[7]=a=>v.imprimirTest())},{default:(0,r.w5)((()=>[(0,r.Uk)("Imprimir test")])),_:1})]),(0,r._)("div",f,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[8]||(o[8]=a=>v.cambiarPrecio())},{default:(0,r.w5)((()=>[(0,r.Uk)("Editar productos")])),_:1})]),(0,r._)("div",g,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100"},{default:(0,r.w5)((()=>[(0,r.Uk)("Listado de ventas")])),_:1})]),(0,r._)("div",w,[(0,r.Wm)(D,{color:"primary",size:"lg",class:"w-100",onClick:o[9]||(o[9]=a=>v.goToDoctor())},{default:(0,r.w5)((()=>[(0,r.Uk)("Toc Doctor")])),_:1})])]),(0,r.Wm)(h),(0,r.Wm)(M,{ref:"modalConfiguradorRef"},null,512),(0,r.Wm)(z,{ref:"modalImpresoraRef"},null,512),(0,r.Wm)(B,{ref:"modalDatafonoRef"},null,512)],64)}var _=e(9741),k=e(4313),D=e(2492),h=e.n(D),M=e(4311),z=e(9242);const B={class:"row"},y={key:0,class:"row mt-2"},C={class:"input-group mb-3"},b=(0,r._)("span",{class:"input-group-text",id:"basic-addon1"},"VID",-1),I={class:"input-group mb-3"},T=(0,r._)("span",{class:"input-group-text",id:"basic-addon1"},"PID",-1),U={class:"row mt-2"},E={class:"d-inline-block text-end"};function x(a,o,e,t,l,s){const i=(0,r.up)("MDBSelect"),c=(0,r.up)("MDBBtn"),n=(0,r.up)("MDBModalBody"),d=(0,r.up)("MDBModal");return(0,r.wg)(),(0,r.j4)(d,{id:"modalImpresora",tabindex:"-1",labelledby:"tituloModalImpresora",modelValue:t.modalImpresora,"onUpdate:modelValue":o[5]||(o[5]=a=>t.modalImpresora=a),staticBackdrop:"",size:"xl"},{default:(0,r.w5)((()=>[(0,r.Wm)(n,null,{default:(0,r.w5)((()=>[(0,r._)("div",B,[(0,r.Wm)(i,{options:t.opciones,"onUpdate:options":o[0]||(o[0]=a=>t.opciones=a),size:"lg",label:"Tipo impresora"},null,8,["options"])]),"USB"===t.selected?((0,r.wg)(),(0,r.iD)("div",y,[(0,r._)("div",C,[b,(0,r.wy)((0,r._)("input",{type:"text",class:"form-control form-control-lg","onUpdate:modelValue":o[1]||(o[1]=a=>t.vid=a),placeholder:"0x04B8"},null,512),[[z.nr,t.vid]])]),(0,r._)("div",I,[T,(0,r.wy)((0,r._)("input",{type:"text",class:"form-control form-control-lg","onUpdate:modelValue":o[2]||(o[2]=a=>t.pid=a),placeholder:"0x0202"},null,512),[[z.nr,t.pid]])])])):(0,r.kq)("",!0),(0,r._)("div",U,[(0,r._)("div",E,[(0,r.Wm)(c,{color:"primary",size:"lg",onClick:o[3]||(o[3]=a=>t.guardar())},{default:(0,r.w5)((()=>[(0,r.Uk)("Guardar")])),_:1}),(0,r.Wm)(c,{color:"danger",size:"lg",class:"mt-2",onClick:o[4]||(o[4]=a=>t.modalImpresora=!1)},{default:(0,r.w5)((()=>[(0,r.Uk)("Cancelar")])),_:1})])])])),_:1})])),_:1},8,["modelValue"])}var V=e(4870),W={name:"ModalImpresoraComponent",components:{MDBModal:k.j3,MDBModalBody:k.Yz,MDBBtn:k.$v,MDBSelect:k.R3},setup(a,{expose:o}){const e=(0,V.iH)(!1),t=(0,V.iH)(""),l=(0,V.iH)(""),s=(0,V.iH)([{text:"USB",value:"USB",selected:!0},{text:"SERIE",value:"SERIE"},{text:"MQTT",value:"MQTT"}]),i=(0,r.Fl)((()=>{if(s.value)for(let a=0;a<s.value.length;a++)if(!0===s.value[a]?.selected)return s.value[a].value;return"USB"}));function c(){e.value=!0}async function n(){try{switch(i.value){case"USB":if(""==t.value||""==l.value)throw Error("El tipo USB necesita los valores VID y PID");{const a=await M.Z.post("parametros/setVidAndPid",{vid:t.value,pid:l.value});if(!a.data)throw Error("Error al guardar los parámetros de la impresora USB");h().fire("OK","Datos de la impresora USB guardados correctamente","success"),e.value=!1}break;default:if("SERIE"!==i.value&&"MQTT"!==i.value)throw Error("Tipo de impresora desconocido");{const a=await M.Z.post("parametros/setTipoImpresora",{tipo:i.value});if(!a.data)throw Error("No se ha podido guardar el tipo de impresora");h().fire("OK","Datos de la impresora USB guardados correctamente","success"),e.value=!1}}}catch(a){h().fire("Oops...",a.message,"error")}}return o({abrirModal:c}),{modalImpresora:e,opciones:s,selected:i,vid:t,pid:l,guardar:n}}},P=e(89);const O=(0,P.Z)(W,[["render",x]]);var R=O;const S={class:"row mt-2"},Z={class:"input-group mb-3"},j=(0,r._)("span",{class:"input-group-text",id:"basic-addon1"},"IP",-1),H={class:"row mt-2"},K={class:"d-inline-block text-end"};function N(a,o,e,t,l,s){const i=(0,r.up)("MDBBtn"),c=(0,r.up)("MDBModalBody"),n=(0,r.up)("MDBModal");return(0,r.wg)(),(0,r.j4)(n,{id:"modalDatafono",tabindex:"-1",labelledby:"tituloModalDatafono",modelValue:t.modalDatafono,"onUpdate:modelValue":o[3]||(o[3]=a=>t.modalDatafono=a),staticBackdrop:"",size:"xl"},{default:(0,r.w5)((()=>[(0,r.Wm)(c,null,{default:(0,r.w5)((()=>[(0,r._)("div",S,[(0,r._)("div",Z,[j,(0,r.wy)((0,r._)("input",{type:"text",class:"form-control form-control-lg","onUpdate:modelValue":o[0]||(o[0]=a=>t.ip=a),placeholder:"192.168.X.X"},null,512),[[z.nr,t.ip]])])]),(0,r._)("div",H,[(0,r._)("div",K,[(0,r.Wm)(i,{color:"primary",size:"lg",onClick:o[1]||(o[1]=a=>t.guardar())},{default:(0,r.w5)((()=>[(0,r.Uk)("Guardar")])),_:1}),(0,r.Wm)(i,{color:"danger",size:"lg",class:"mt-2",onClick:o[2]||(o[2]=a=>t.modalDatafono=!1)},{default:(0,r.w5)((()=>[(0,r.Uk)("Cancelar")])),_:1})])])])),_:1})])),_:1},8,["modelValue"])}var $={name:"ModalDatafonoComponent",components:{MDBModal:k.j3,MDBModalBody:k.Yz,MDBBtn:k.$v},setup(a,{expose:o}){const e=(0,V.iH)(!1),r=(0,V.iH)("");function t(){e.value=!0}async function l(){try{if(""==r.value)throw Error("Error al guardar la IP del datafono.");{const a=await M.Z.post("parametros/setIpPaytef",{ip:r.value});if(!a.data)throw Error("Error al guardar la IP del datafono.");h().fire("OK","La ip del datafono ha sido modificada correctamente","success"),e.value=!1}}catch(a){h().fire("Oops...",a.message,"error")}}return o({abrirModal:t}),{modalDatafono:e,ip:r,guardar:l}}};const A=(0,P.Z)($,[["render",N]]);var F=A,q={name:"TecnicoView",components:{VolverComponent:_.Z,ModalImpresoraComponent:R,ModalDatafonoComponent:F,MDBBtn:k.$v},setup(){const a=(0,V.iH)(null),o=(0,V.iH)(null);function e(){M.Z.post("clientes/descargarClientesFinales").then((a=>{if(!a.data)throw Error("No se han podido descargar los clientes finales");h().fire("OK","Clientes finales actualizados correctamente","success")})).catch((a=>{h().fire("Oops...",a.message,"error")}))}function r(){console.log("descargarTicketInfo")}function t(){M.Z.get("tarifas/descargarTarifas").then((a=>{if(!a.data)throw Error("No se han podido descargar las tarifas especiales");h().fire("OK","Tarifas especiales descargadas correctamente","success")})).catch((a=>{h().fire("Oops...",a.message,"error")}))}function l(){console.log("actualizarTrabajadores")}function s(){M.Z.post("teclado/actualizarTeclado").then((a=>{if(!a.data)throw Error("No se ha podido actualizar el teclado");h().fire("OK","Teclado actualizado correctamente","success"),document.location.href=`http://${window.location.hostname}:3000`})).catch((a=>{h().fire("Oops...",a.message,"error")}))}function i(){console.log("imprimirTest")}function c(){console.log("cambiarPrecio")}function n(){M.Z.get("parametros/actualizarParametros").then((a=>{if(!a.data)throw Error("No se han podido actualizar los parámetros");h().fire("OK","Parámetros actualizados correctamente","success"),document.location.href=`http://${window.location.hostname}:3000`})).catch((a=>{h().fire("Oops...",a.message,"error")}))}function d(){console.log("goToDoctor")}return{descargarClientesFinales:e,descargarTarifasEspeciales:t,descargarTicketInfo:r,actualizarTrabajadores:l,actualizarTeclados:s,imprimirTest:i,cambiarPrecio:c,actualizarParametros:n,goToDoctor:d,modalImpresoraRef:a,modalDatafonoRef:o}}};const L=(0,P.Z)(q,[["render",v]]);var Q=L}}]);
//# sourceMappingURL=584.5e7fb61d.js.map