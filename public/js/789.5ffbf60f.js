"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[789],{5789:function(a,e,s){s.r(e),s.d(e,{default:function(){return j}});var t=s(3396),r=s(7139);const o={key:0,class:"row mt-2 overflow-auto sizeGeneral"},l={key:0},n={style:{"font-size":"1.2rem"}},i={class:"overflow-auto text-truncate listaCesta"},u={class:"list-group"},d={class:"d-inline-block text-truncate",style:{"max-width":"12rem"}},c={class:"ms-1",style:{"vertical-align":"top"}},v={key:1,class:"row sizeGeneral"},m={key:2,class:"position-absolute bottom-0 start-0"};function b(a,e,s,b,M,p){const C=(0,t.up)("MDBCardTitle"),f=(0,t.up)("MDBCardText"),y=(0,t.up)("MDBCardBody"),w=(0,t.up)("MDBCard"),g=(0,t.up)("MesasComponent");return(0,t.wg)(),(0,t.iD)(t.HY,null,[!b.vistaMesas&&b.arrayTrabajadores&&b.arrayCestas&&null!=b.indexActivoTrabajador&&void 0!=b.indexActivoTrabajador?((0,t.wg)(),(0,t.iD)("div",o,[((0,t.wg)(!0),(0,t.iD)(t.HY,null,(0,t.Ko)(b.totalRows,((a,e)=>((0,t.wg)(),(0,t.iD)("div",{class:"row",key:e},[((0,t.wg)(),(0,t.iD)(t.HY,null,(0,t.Ko)(4,((a,s)=>((0,t.wg)(),(0,t.iD)(t.HY,{key:s},[4*e+s+1<=b.arrayCestas.length?((0,t.wg)(),(0,t.j4)(w,{key:0,onClick:a=>b.seleccionar(b.arrayCestas[4*e+s]),class:(0,r.C_)(["cesta mb-3 ms-2 me-1",{cestaActiva:b.arrayCestas[4*e+s]._id===b.idCestaSeleccionada}])},{default:(0,t.w5)((()=>[(0,t.Wm)(y,null,{default:(0,t.w5)((()=>[(0,t.Wm)(C,null,{default:(0,t.w5)((()=>[(0,t.Uk)((0,r.zw)(b.arrayCestas[4*e+s].modo)+" ",1),b.arrayMesas[4*e+s]&&null!=b.arrayCestas[4*e+s].indexMesa?((0,t.wg)(),(0,t.iD)("span",l,"Mesa: "+(0,r.zw)(b.arrayMesas[b.arrayCestas[4*e+s].indexMesa].nombre),1)):(0,t.kq)("",!0)])),_:2},1024),(0,t.Wm)(f,null,{default:(0,t.w5)((()=>[(0,t._)("span",n,"Total: "+(0,r.zw)(b.getTotal(b.arrayCestas[4*e+s]).toFixed(2))+" €",1),(0,t._)("div",i,[(0,t._)("ul",u,[((0,t.wg)(!0),(0,t.iD)(t.HY,null,(0,t.Ko)(b.arrayCestas[4*e+s].lista,((a,e)=>((0,t.wg)(),(0,t.iD)("li",{key:e,class:"list-group-item"},[(0,t._)("span",d,(0,r.zw)(a.nombre),1),(0,t._)("span",c,"x"+(0,r.zw)(a.unidades),1)])))),128))])])])),_:2},1024)])),_:2},1024)])),_:2},1032,["onClick","class"])):(0,t.kq)("",!0)],64)))),64))])))),128))])):(0,t.kq)("",!0),b.vistaMesas?((0,t.wg)(),(0,t.iD)("div",v,[(0,t.Wm)(g)])):(0,t.kq)("",!0),b.vistaMesas?(0,t.kq)("",!0):((0,t.wg)(),(0,t.iD)("div",m,[(0,t._)("button",{onClick:e[0]||(e[0]=a=>b.volver()),class:"btn btn-warning ms-2",style:{"font-size":"27px"}}," VOLVER "),(0,t._)("button",{onClick:e[1]||(e[1]=a=>b.switchMesas()),class:"btn btn-primary ms-2",style:{"font-size":"27px"}}," VISTA MESAS "),(0,t._)("button",{onClick:e[2]||(e[2]=a=>b.nuevaCesta()),class:"btn btn-success ms-2",style:{"font-size":"27px"}}," CREAR CESTA "),(0,t._)("button",{onClick:e[3]||(e[3]=a=>b.borrarCesta()),class:"btn btn-danger ms-2",style:{"font-size":"27px"}}," BORRAR CESTA ")]))],64)}var M=s(4870),p=s(65),C=s(4313),f=s(8686),y=s(70),w=s(2492),g=s.n(w);const k=["onClick"],h={class:"nombreMesa"},_={class:"position-relative footer"},x={class:"position-absolute bottom-0 start-0"},D={class:"position-absolute bottom-0 end-0"};function A(a,e,s,o,l,n){const i=(0,t.up)("MDBInput"),u=(0,t.up)("MDBModalBody"),d=(0,t.up)("MDBBtn"),c=(0,t.up)("MDBModalFooter"),v=(0,t.up)("MDBModal");return(0,t.wg)(),(0,t.iD)(t.HY,null,[o.arrayMesas.length>0?((0,t.wg)(),(0,t.iD)(t.HY,{key:0},(0,t.Ko)(5,((a,e)=>(0,t._)("div",{class:"row mt-2",key:e},[((0,t.wg)(),(0,t.iD)(t.HY,null,(0,t.Ko)(10,((a,s)=>(0,t._)("div",{class:(0,r.C_)(["mesa ms-2",[0===s?"ms-5":"",s+10*e===o.indexMesaActiva?"border border-4 border-dark":"",o.arrayMesas[s+10*e].nombre?"habilitada":"deshabilitada"]]),key:s,onClick:a=>o.setIndexActivo(s+10*e)},[(0,t._)("span",h,(0,r.zw)(o.arrayMesas[s+10*e].nombre),1)],10,k))),64))]))),64)):(0,t.kq)("",!0),(0,t._)("div",_,[(0,t._)("div",x,[(0,t._)("button",{onClick:e[0]||(e[0]=a=>o.volver()),class:"btn btn-warning ms-2",style:{"font-size":"27px"}}," Volver "),(0,t._)("button",{onClick:e[1]||(e[1]=a=>o.switchMesas()),class:"btn btn-primary ms-2",style:{"font-size":"27px"}}," Vista cestas ")]),(0,t._)("div",D,[o.arrayMesas&&null!=o.indexMesaActiva&&void 0!=o.indexMesaActiva&&o.arrayMesas[o.indexMesaActiva]&&o.arrayMesas[o.indexMesaActiva].nombre?((0,t.wg)(),(0,t.iD)("button",{key:0,onClick:e[2]||(e[2]=a=>o.desactivarMesa()),class:"btn btn-danger ms-2",style:{"font-size":"27px"}}," Eliminar mesa ")):((0,t.wg)(),(0,t.iD)("button",{key:1,onClick:e[3]||(e[3]=a=>o.activarMesa()),class:"btn btn-success ms-2",style:{"font-size":"27px"}}," Activar mesa ")),o.arrayMesas&&null!=o.indexMesaActiva&&void 0!=o.indexMesaActiva&&o.arrayMesas[o.indexMesaActiva]&&o.arrayMesas[o.indexMesaActiva].nombre?((0,t.wg)(),(0,t.iD)("button",{key:2,onClick:e[4]||(e[4]=a=>o.modalNombreMesa=!0),class:"btn btn-info ms-2",style:{"font-size":"27px"}}," Cambiar nombre ")):(0,t.kq)("",!0)])]),(0,t.Wm)(v,{id:"modalNombreMesa",tabindex:"-1",modelValue:o.modalNombreMesa,"onUpdate:modelValue":e[8]||(e[8]=a=>o.modalNombreMesa=a)},{default:(0,t.w5)((()=>[(0,t.Wm)(u,null,{default:(0,t.w5)((()=>[(0,t.Wm)(i,{label:"Introduce el nombre de la mesa",size:"lg",modelValue:o.inputNombre,"onUpdate:modelValue":e[5]||(e[5]=a=>o.inputNombre=a)},null,8,["modelValue"])])),_:1}),(0,t.Wm)(c,null,{default:(0,t.w5)((()=>[(0,t.Wm)(d,{color:"secondary",size:"lg",onClick:e[6]||(e[6]=a=>o.modalNombreMesa=!1)},{default:(0,t.w5)((()=>[(0,t.Uk)("Cerrar")])),_:1}),(0,t.Wm)(d,{color:"primary",size:"lg",onClick:e[7]||(e[7]=a=>o.cambiarNombre())},{default:(0,t.w5)((()=>[(0,t.Uk)("Guardar cambios")])),_:1})])),_:1})])),_:1},8,["modelValue"])],64)}var B={name:"MesasComponent",components:{MDBModal:C.j3,MDBModalBody:C.Yz,MDBModalFooter:C.ab,MDBBtn:C.$v,MDBInput:C.u2},setup(){const a=(0,M.iH)([]),e=(0,M.iH)(0),s=(0,M.iH)(null),r=(0,M.iH)("");function o(a){e.value=a}async function l(e){try{const s=(await y.Z.post("cestas/onlyCrearCestaParaMesa",{indexMesa:e})).data;if(!s)throw Error("No se ha podido crear la cesta para la nueva mesa");a.value[e].idCesta=s,d()}catch(s){g().fire("Oops...",s.message,"error")}}function n(){a.value&&null!=e.value&&void 0!=e.value&&a.value[e.value]&&(a.value[e.value]={nombre:"Mesa "+(e.value+1)},l(e.value))}function i(){a.value&&null!=e.value&&void 0!=e.value&&a.value[e.value]&&(y.Z.post("cestas/fulminarCesta",{idCesta:a.value[e.value].idCesta}).then((a=>{if(!a.data)throw Error("No se ha podido eliminar la cesta de la mesa")})).catch((a=>{g().fire("Oops...",a.message,"error")})),a.value[e.value]={nombre:null,idCesta:null},d())}function u(){a.value&&null!=e.value&&void 0!=e.value&&a.value[e.value]&&(a.value[e.value].nombre=r.value,s.value=!1,d())}function d(){y.Z.post("mesas/guardarCambios",{arrayMesas:a.value}).then((a=>{if(!a.data)throw Error("No se han podido guardar los cambios")})).catch((a=>{g().fire("Oops...",a.message,"error")}))}const c=(0,t.f3)("volver"),v=(0,t.f3)("switchMesas");return(0,t.bv)((()=>{y.Z.get("mesas/getMesas").then((e=>{if(!e.data||50!==e.data.length)throw Error("Error al obtener la configuración de mesas");a.value=e.data})).catch((a=>{g().fire("Oops...",a.message,"error")}))})),{arrayMesas:a,indexMesaActiva:e,setIndexActivo:o,volver:c,switchMesas:v,activarMesa:n,desactivarMesa:i,cambiarNombre:u,modalNombreMesa:s,inputNombre:r}}},z=s(89);const T=(0,z.Z)(B,[["render",A],["__scopeId","data-v-3dc4100a"]]);var E=T,N={name:"CestasView",components:{MDBCard:C.Yl,MDBCardBody:C.H7,MDBCardTitle:C.QM,MDBCardText:C.Pp,MesasComponent:E},setup(){const a=(0,p.oR)(),e=(0,M.iH)(!1),s=(0,t.Fl)((()=>a.state.Configuracion.parametros)),r=(0,t.Fl)((()=>a.state.Cestas.arrayCestas)),o=(0,M.iH)([]),l=(0,t.Fl)((()=>a.state.Trabajadores.arrayTrabajadores)),n=(0,t.Fl)((()=>a.state.Trabajadores.indexActivo)),i=(0,M.iH)(null);function u(){"Si"===s.value?.mesas&&(e.value?(w(),e.value=!1):e.value=!0)}function d(){f.Z.back()}function c(a){return a.detalleIva.importe1+a.detalleIva.importe2+a.detalleIva.importe3+a.detalleIva.importe4+a.detalleIva.importe5}function v(){void 0!=n.value&&null!=n.value&&l.value&&y.Z.post("cestas/crearCesta",{idTrabajador:l.value[n.value]._id}).then((a=>{if(!a.data)throw Error("No se ha podido crear una nueva cesta")})).catch((a=>{g().fire("Oops...",a.message,"error")}))}function m(){if(i.value){for(let a=0;a<r.value.length;a++)if(r.value[a]._id===i.value&&null!=r.value[a].indexMesa&&void 0!=r.value[a].indexMesa)return g().fire("Oops...","No puedes eliminar una cesta de tipo MESA","error"),!1;y.Z.post("cestas/fulminarCesta",{idCesta:i.value}).then((a=>{if(!a.data)throw Error("No se ha podido borrar la cesta")})).catch((a=>{g().fire("Oops...",a.message,"error")}))}}const b=(0,t.Fl)((()=>{const a=r.value.length;let e=Math.trunc(a/4);return a%4>0&&(e+=1),e}));function C(a){l.value&&void 0!=n.value&&null!=n.value&&l.value[n.value]?(i.value=a._id,y.Z.post("cestas/cambiarCestaTrabajador",{idCesta:a._id,idTrabajador:l.value[n.value]._id})):g().fire("Oops...","Error, no se ha podido seleccionar la cesta para el trabajador","error")}function w(){y.Z.get("mesas/getMesas").then((a=>{if(!a.data||50!==a.data.length)throw Error("Error al obtener la configuración de mesas");o.value=a.data,console.log(o.value)})).catch((a=>{g().fire("Oops...",a.message,"error")}))}return(0,t.JJ)("volver",d),(0,t.JJ)("switchMesas",u),(0,t.bv)((()=>{i.value=l.value[n.value].idCesta,w()})),{vistaMesas:e,switchMesas:u,arrayCestas:r,arrayTrabajadores:l,indexActivoTrabajador:n,volver:d,getTotal:c,seleccionar:C,totalRows:b,nuevaCesta:v,borrarCesta:m,arrayMesas:o,idCestaSeleccionada:i}}};const H=(0,z.Z)(N,[["render",b],["__scopeId","data-v-03625cea"]]);var j=H}}]);
//# sourceMappingURL=789.5ffbf60f.js.map