"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[879],{6879:function(a,e,o){o.r(e),o.d(e,{default:function(){return q}});var r=o(3396),s=o(7139);const t=a=>((0,r.dD)("data-v-1bbf43d2"),a=a(),(0,r.Cn)(),a),n={class:"row mt-2"},l={class:"row mt-4"},i={key:0,class:"col tablaDescansando table-responsive d-inline",style:{"background-color":"white"}},c={class:"table"},d=t((()=>(0,r._)("thead",null,[(0,r._)("tr",null,[(0,r._)("th",{class:"tituloDescanso"},"Trabajadores en descanso activo")])],-1))),u=["onClick"],f={class:"textoNombre d-inline-block text-truncate"},m={class:"col anchoCajaConsumoPersonal"};function v(a,e,o,t,v,b){const p=(0,r.up)("MDBCardTitle"),h=(0,r.up)("MDBIcon"),_=(0,r.up)("MDBCardBody"),w=(0,r.up)("MDBCard"),D=(0,r.up)("MDBBtn"),j=(0,r.up)("FichajesModal");return(0,r.wg)(),(0,r.iD)(r.HY,null,[(0,r._)("div",n,[(0,r.Wm)(w,{onClick:e[0]||(e[0]=a=>t.modalFichajes.abrirModal()),class:"estiloCard ms-4"},{default:(0,r.w5)((()=>[(0,r.Wm)(_,{class:"text-center"},{default:(0,r.w5)((()=>[(0,r.Wm)(p,null,{default:(0,r.w5)((()=>[(0,r.Uk)("Iniciar turno")])),_:1}),(0,r.Wm)(h,{class:"mt-3",icon:"play",iconStyle:"fas",size:"6x"})])),_:1})])),_:1}),(0,r.Wm)(w,{onClick:e[1]||(e[1]=a=>t.iniciarDescanso()),class:"estiloCard ms-4"},{default:(0,r.w5)((()=>[(0,r.Wm)(_,{class:"text-center"},{default:(0,r.w5)((()=>[(0,r.Wm)(p,null,{default:(0,r.w5)((()=>[(0,r.Uk)("Iniciar descanso")])),_:1}),(0,r.Wm)(h,{class:"mt-3",icon:"pause",iconStyle:"fas",size:"6x"})])),_:1})])),_:1}),(0,r.Wm)(w,{onClick:e[2]||(e[2]=a=>t.preguntarFinalizarTurno()),class:"estiloCard ms-4"},{default:(0,r.w5)((()=>[(0,r.Wm)(_,{class:"text-center"},{default:(0,r.w5)((()=>[(0,r.Wm)(p,null,{default:(0,r.w5)((()=>[(0,r.Uk)("Finalizar turno")])),_:1}),(0,r.Wm)(h,{class:"mt-3",icon:"stop",iconStyle:"fas",size:"6x"})])),_:1})])),_:1})]),(0,r._)("div",l,[t.arrayTrabajadoresDescanso&&t.arrayTrabajadoresDescanso.length>0?((0,r.wg)(),(0,r.iD)("div",i,[(0,r._)("table",c,[d,(0,r._)("tbody",null,[((0,r.wg)(!0),(0,r.iD)(r.HY,null,(0,r.Ko)(t.arrayTrabajadoresDescanso,((a,e)=>((0,r.wg)(),(0,r.iD)("tr",{key:e,class:(0,s.C_)({activoTabla:a._id===t.idActivoDescanso}),onClick:e=>t.setActivo(a._id)},[(0,r._)("td",null,[(0,r._)("span",f,(0,s.zw)(a.nombre),1)])],10,u)))),128))])])])):(0,r.kq)("",!0),(0,r._)("div",m,[t.trabajadorActivo?((0,r.wg)(),(0,r.j4)(D,{key:0,onClick:e[3]||(e[3]=a=>t.activarConsumoPersonal()),color:"primary",class:"w-100 botonConsumoPersonal"},{default:(0,r.w5)((()=>[(0,r.Uk)("Consumo personal")])),_:1})):(0,r.kq)("",!0),null!=t.idActivoDescanso?((0,r.wg)(),(0,r.j4)(D,{key:1,onClick:e[4]||(e[4]=a=>t.preguntarFinalDescanso()),color:"primary",class:"w-100 botonConsumoPersonal mt-4"},{default:(0,r.w5)((()=>[(0,r.Uk)("Finalizar descanso")])),_:1})):(0,r.kq)("",!0)])]),(0,r.Wm)(j,{ref:"modalFichajes"},null,512)],64)}o(7658);var b=o(4834),p=o(70),h=o(4313),_=o(2492),w=o.n(_),D=o(4870),j=o(65),C=o(9242);const B=a=>((0,r.dD)("data-v-0e6bdf38"),a=a(),(0,r.Cn)(),a),g={class:"row"},M={key:0,class:"row mt-2"},k={class:"table table-striped"},y={class:"textoNombre d-inline-block text-truncate"},F={key:1,class:"row"},T=B((()=>(0,r._)("div",{class:"sinResultados position-relative"},[(0,r._)("span",{class:"textoSinResultados position-absolute top-50 start-50 translate-middle"},"Sin resultados")],-1))),W=[T];function x(a,e,o,t,n,l){const i=(0,r.up)("MDBModalTitle"),c=(0,r.up)("MDBModalHeader"),d=(0,r.up)("MDBBtn"),u=(0,r.up)("MDBModalBody"),f=(0,r.up)("MDBModalFooter"),m=(0,r.up)("MDBModal");return(0,r.wg)(),(0,r.j4)(m,{id:"modalFichajes",tabindex:"-1",labelledby:"staticBackdropLabel",modelValue:t.modalFichajes,"onUpdate:modelValue":e[2]||(e[2]=a=>t.modalFichajes=a),size:"xl",modalFichajes:""},{default:(0,r.w5)((()=>[(0,r.Wm)(c,null,{default:(0,r.w5)((()=>[(0,r.Wm)(i,{id:"staticBackdropLabel"},{default:(0,r.w5)((()=>[(0,r.Uk)(" Fichar ")])),_:1})])),_:1}),(0,r.Wm)(u,null,{default:(0,r.w5)((()=>[(0,r._)("div",g,[(0,r.wy)((0,r._)("input",{class:"form-control inputBusqueda w-100",type:"text",placeholder:"Buscar por nombre","aria-label":".form-control-lg example","onUpdate:modelValue":e[0]||(e[0]=a=>t.inputBusqueda=a)},null,512),[[C.nr,t.inputBusqueda]])]),t.arrayTrabajadores&&t.arrayTrabajadores.length>0?((0,r.wg)(),(0,r.iD)("div",M,[(0,r._)("table",k,[(0,r._)("tbody",null,[((0,r.wg)(!0),(0,r.iD)(r.HY,null,(0,r.Ko)(t.arrayTrabajadores,((a,e)=>((0,r.wg)(),(0,r.iD)("tr",{key:e},[(0,r._)("td",null,[(0,r._)("span",y,(0,s.zw)(a.nombre),1)]),(0,r._)("td",null,[(0,r.Wm)(d,{color:"primary",size:"lg",onClick:e=>t.fichar(a._id),class:"w-100",style:{height:"3.85rem","font-size":"1.5rem"}},{default:(0,r.w5)((()=>[(0,r.Uk)("Fichar")])),_:2},1032,["onClick"])])])))),128))])])])):((0,r.wg)(),(0,r.iD)("div",F,W))])),_:1}),(0,r.Wm)(f,null,{default:(0,r.w5)((()=>[(0,r.Wm)(d,{color:"primary",size:"lg",onClick:e[1]||(e[1]=a=>t.modalFichajes=!1)},{default:(0,r.w5)((()=>[(0,r.Uk)(" Cerrar ")])),_:1})])),_:1})])),_:1},8,["modelValue"])}var z={name:"FichajesModal",components:{MDBModal:h.j3,MDBModalHeader:h.ol,MDBModalTitle:h.wo,MDBModalBody:h.Yz,MDBModalFooter:h.ab,MDBBtn:h.$v},setup(){const a=(0,D.iH)(null),e=(0,D.iH)([]),o=(0,D.iH)("");function s(){a.value=!0}function t(){p.Z.post("trabajadores/buscar",{busqueda:o.value}).then((a=>{e.value=a.data})).catch((a=>{w().fire("Oops...",a.message,"error")}))}function n(e){p.Z.post("trabajadores/fichar",{idTrabajador:e}).then((e=>{if(!e.data)throw Error("Error, no se ha podido fichar");b.W.cargarTrabajadoresFichados(),a.value=!1})).catch((a=>{w().fire("Oops...",a.message,"error")}))}return(0,r.YP)(o,(()=>{t()})),{modalFichajes:a,abrirModal:s,arrayTrabajadores:e,inputBusqueda:o,fichar:n}}},E=o(89);const H=(0,E.Z)(z,[["render",x],["__scopeId","data-v-0e6bdf38"]]);var O=H,U=o(8686),A={name:"fichajesView",components:{MDBIcon:h.vm,FichajesModal:O,MDBCard:h.Yl,MDBCardBody:h.H7,MDBCardTitle:h.QM,MDBBtn:h.$v},setup(){const a=(0,j.oR)(),e=(0,D.iH)(null),o=(0,D.iH)([]),s=(0,D.iH)(null),t=(0,r.Fl)((()=>a.state.Trabajadores.arrayTrabajadores)),n=(0,r.Fl)((()=>a.state.Trabajadores.indexActivo)),l=(0,r.Fl)((()=>t.value&&void 0!=n.value&&null!=n.value&&t.value[n.value]?t.value[n.value]:null)),i=(0,r.Fl)((()=>a.state.Cestas.arrayCestas)),c=(0,r.Fl)((()=>{if(i.value)for(let a=0;a<i.value.length;a++)if(i.value[a]._id==t.value[n.value].idCesta)return i.value[a];return null}));function d(a){s.value=a}function u(){s.value=null}function f(){p.Z.post("trabajadores/desfichar",{idTrabajador:l.value._id}).then((a=>{if(!a.data)throw Error("Error, no se ha podido registrar el fin de turno (backend)");b.W.cargarTrabajadoresFichados(),w().fire("OK","Fin de turno registrado correctamente","success")})).catch((a=>{w().fire("Oops...",a.message,"error")}))}function m(a){for(let e=0;e<o.value.length;e++)if(a===o.value[e]._id)return o.value[e];return null}function v(){if(s.value){const a=m(s.value);a&&w().fire({title:"Por favor, confirma el descanso para: ",html:`${a.nombre}`,showCancelButton:!0,cancelButtonText:"Cancelar",confirmButtonText:"Confirmar"}).then((a=>{a.isConfirmed&&C(s.value)}))}}async function h(){if(i.value&&c.value)for(let e=0;e<i.value.length;e++)if(i.value[e]._id===c.value._id){await a.dispatch("Cestas/setModoCesta",{modo:"CONSUMO_PERSONAL",index:e}),U.Z.push("/main");break}}function _(){l.value&&w().fire({title:"Confirma. Fin de turno para: ",html:`${l.value.nombre}`,showCancelButton:!0,cancelButtonText:"Cancelar",confirmButtonText:"Confirmar"}).then((a=>{a.isConfirmed&&f()}))}function C(a){p.Z.post("trabajadores/finDescanso",{idTrabajador:a}).then((a=>{if(!a.data)throw Error("Error, no se  ha podido iniciar el descanso");b.W.cargarTrabajadoresFichados(),u(),g(),w().fire("Descanso finalizado","","success")})).catch((a=>{w().fire("Oops...",a.message,"error")}))}function B(){l.value._id?p.Z.post("trabajadores/inicioDescanso",{idTrabajador:l.value._id}).then((a=>{if(!a.data)throw Error("Error, no se ha podido iniciar el descanso");g(),b.W.cargarTrabajadoresFichados(),w().fire("OK","Descanso iniciado correctamente","success")})).catch((a=>{w().fire("Oops...",a.message,"error")})):w().fire("Importante....","Es necesario un trabajador activo para realizar esta acción","warning")}function g(){p.Z.get("trabajadores/descansando").then((a=>{if(!a.data)throw Error("Error, no se han podido obtener los trabajadores en descanso");o.value=a.data})).catch((a=>{w().fire("Oops...",a.message,"error")}))}return(0,r.bv)((()=>{g()})),{modalFichajes:e,arrayTrabajadoresDescanso:o,idActivoDescanso:s,setActivo:d,trabajadorActivo:l,finDeTurno:f,iniciarDescanso:B,preguntarFinalDescanso:v,resetidActivoDescansando:u,preguntarFinalizarTurno:_,activarConsumoPersonal:h}}};const Z=(0,E.Z)(A,[["render",v],["__scopeId","data-v-1bbf43d2"]]);var q=Z}}]);
//# sourceMappingURL=879.47cbe683.js.map