"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[720],{7767:function(t,a,e){e.d(a,{Z:function(){return v}});var n=e(3396);const o={class:"btn-group-vertical mt-1"},l={class:"btn-group"},d={class:"btn-group"},u={class:"btn-group"},c={class:"btn-group"},r={class:"btn-group"};function s(t,a,e,s,i,p){return(0,n.wg)(),(0,n.iD)("div",o,[(0,n._)("div",l,[(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[0]||(a[0]=t=>s.addTecla("1"))}," 1 "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[1]||(a[1]=t=>s.addTecla("2"))}," 2 "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[2]||(a[2]=t=>s.addTecla("3"))}," 3 ")]),(0,n._)("div",d,[(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[3]||(a[3]=t=>s.addTecla("4"))}," 4 "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[4]||(a[4]=t=>s.addTecla("5"))}," 5 "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[5]||(a[5]=t=>s.addTecla("6"))}," 6 ")]),(0,n._)("div",u,[(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[6]||(a[6]=t=>s.addTecla("7"))}," 7 "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[7]||(a[7]=t=>s.addTecla("8"))}," 8 "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[8]||(a[8]=t=>s.addTecla("9"))}," 9 ")]),(0,n._)("div",c,[(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[9]||(a[9]=t=>s.deleteTecla())}," < "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[10]||(a[10]=t=>s.addTecla("0"))}," 0 "),(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonNumpad",onClick:a[11]||(a[11]=t=>s.okValue(Number(s.cantidad)))}," OK ")]),(0,n._)("div",r,[(0,n._)("button",{type:"button",class:"btn btn-outline-secondary py-3 botonComa",onClick:a[12]||(a[12]=t=>s.addTecla("."))}," , ")])])}var i=e(4870),p={name:"NumpadComponent",setup(t,{expose:a}){const e=(0,i.iH)("0"),o=(0,n.f3)("okValue"),l=(0,i.iH)("5.5rem"),d=(0,i.iH)("5.5rem");function u(t){"."===t&&(e.value=e.value.replace(".","")),e.value+=t,"0"==e.value[0]&&(e.value=e.value.slice(1))}function c(){e.value=e.value.slice(0,-1),""===e.value&&(e.value="0")}function r(t){e.value=t.toString()}return a({cantidad:e,setValor:r}),{okValue:o,cantidad:e,addTecla:u,deleteTecla:c,setValor:r,anchoTecla:l,altoTecla:d}}},b=e(89);const m=(0,b.Z)(p,[["render",s],["__scopeId","data-v-6bb950cc"]]);var v=m},5720:function(t,a,e){e.r(a),e.d(a,{default:function(){return w}});var n=e(3396),o=e(7139),l=e(9242);const d={class:"col-md-9 colJuntitas"},u={class:"input-group input-group-lg"},c={value:"Entrega Diària",selected:""},r={value:"COMPRAS"},s={value:"OTROS"},i={class:"col-md-3 colJuntitas"};function p(t,a,e,p,b,m){const v=(0,n.up)("MDBCardHeader"),y=(0,n.up)("MDBCardBody"),_=(0,n.up)("MDBBtn"),f=(0,n.up)("MDBCardFooter"),C=(0,n.up)("MDBCard"),k=(0,n.up)("NumpadComponent");return(0,n.wg)(),(0,n.iD)(n.HY,null,[(0,n._)("div",d,[(0,n.Wm)(C,{text:"center",class:"sizeSalida mt-2"},{default:(0,n.w5)((()=>[(0,n.Wm)(v,null,{default:(0,n.w5)((()=>[(0,n.Uk)((0,o.zw)(t.$t("salida_de_dinero","Salida de dinero")),1)])),_:1}),p.numpadRef&&p.numpadRef.cantidad?((0,n.wg)(),(0,n.j4)(y,{key:0},{default:(0,n.w5)((()=>[(0,n._)("div",u,[(0,n.wy)((0,n._)("input",{"onUpdate:modelValue":a[0]||(a[0]=t=>p.numpadRef.cantidad=t),type:"text",class:"form-control",placeholder:"Introduce la cantidad",disabled:""},null,512),[[l.nr,p.numpadRef.cantidad]])]),(0,n.wy)((0,n._)("select",{class:"form-select form-select-lg mb-3 mt-2","aria-label":".form-select-lg example","onUpdate:modelValue":a[1]||(a[1]=t=>p.concepto=t)},[(0,n._)("option",c,(0,o.zw)(t.$t("entrega_diaria","ENTREGA DIARIA")),1),(0,n._)("option",r,(0,o.zw)(t.$t("compras","COMPRAS")),1),(0,n._)("option",s,(0,o.zw)(t.$t("otros","OTROS")),1)],512),[[l.bM,p.concepto]])])),_:1})):(0,n.kq)("",!0),(0,n.Wm)(f,{class:"text-muted text-end"},{default:(0,n.w5)((()=>[(0,n.Wm)(_,{color:"success",size:"lg",onClick:a[2]||(a[2]=t=>p.confirmarSalida())},{default:(0,n.w5)((()=>[(0,n.Uk)((0,o.zw)(t.$t("confirmar_salida","Confirmar salida")),1)])),_:1})])),_:1})])),_:1})]),(0,n._)("div",i,[(0,n.Wm)(k,{ref:"numpadRef"},null,512)])],64)}var b=e(4161),m=e(4313),v=e(2492),y=e.n(v),_=e(4870),f=e(65),C=e(7767),k={name:"SalidaComponent",components:{MDBCard:m.Yl,MDBCardHeader:m.uX,MDBCardBody:m.H7,NumpadComponent:C.Z,MDBBtn:m.$v,MDBCardFooter:m.Rw},setup(){const t=(0,f.oR)(),a=(0,n.Fl)((()=>t.state.Trabajadores.arrayTrabajadores)),e=(0,n.Fl)((()=>t.state.Trabajadores.indexActivo)),o=(0,n.Fl)((()=>a.value&&null!=e.value&&void 0!=e.value&&a.value[e.value]?a.value[e.value]:null)),l=(0,_.iH)(null),d=(0,_.iH)("Entrega Diària");function u(){b.Z.post("movimientos/nuevoMovimiento",{cantidad:Number(l.value.cantidad),concepto:d.value,idTrabajador:o.value._id,tipo:"SALIDA"}).then((t=>{if(!t.data)throw Error("No se ha podido realizar la salida de dinero");l.value.setValor("0"),y().fire("Perfecto","Salida de dinero realizada correctamente","success")})).catch((t=>{y().fire("Oops...",t.message,"error")}))}return(0,n.JJ)("okValue",u),{confirmarSalida:u,numpadRef:l,concepto:d}}},T=e(89);const g=(0,T.Z)(k,[["render",p],["__scopeId","data-v-57748354"]]);var w=g}}]);
//# sourceMappingURL=720.379ec57e.js.map