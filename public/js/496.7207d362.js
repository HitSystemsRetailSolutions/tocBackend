"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[496],{9496:function(a,t,e){e.r(t),e.d(t,{default:function(){return ta}});var i=e(3396),c=e(7139);const s={class:"row justify-content-center mt-4"},l={class:"col-7"},o={class:"card"},r=(0,i._)("div",{class:"card-header"},[(0,i._)("h4",null,"Último cierre de caja")],-1),d={class:"card-body"},n={class:"row row-2"},v={class:"col-6"},m=(0,i._)("h6",{class:"text-center"},"Detalle",-1),u={class:"card"},_={class:"card-body"},w={class:"text-muted"},f={class:"row row-2"},g=(0,i._)("div",{class:"col-4"},"Resp:",-1),p={class:"col-8 text-start"},x=(0,i._)("div",{class:"col-4"},"Inici:",-1),C={class:"col-8 text-start"},h=(0,i._)("div",{class:"col-4"},"Final:",-1),H={class:"col-8 text-start"},D=(0,i._)("div",{class:"col-6 mb-2 mt-4"},"Calaix fet:",-1),b={class:"col-4 mb-2 mt-4 text-start"},z=(0,i._)("div",{class:"col-6 mt-2"},"Descuadre:",-1),F={class:"col-4 mt-2 text-start"},M=(0,i._)("div",{class:"col-6 mt-2"},"Clients atessos:",-1),T={class:"col-4 mt-2 text-start"},Z=(0,i._)("div",{class:"col-6 mt-2"},"Rescaudat:",-1),k={class:"col-4 mt-2 text-start"},y=(0,i._)("div",{class:"col-6 mt-2"},"Total 3G:",-1),j={class:"col-4 mt-2 text-start"},U=(0,i._)("div",{class:"col-6 mt-2"},"Canvi inicial:",-1),B={class:"col-4 mt-2 text-start"},I=(0,i._)("div",{class:"col-6 mt-2"},"Canvi final:",-1),G={class:"col-4 mt-2 text-start"},Y={class:"col-6 overflow-scroll"},R=(0,i._)("h6",{class:"text-center"},"Moviments de Caixa",-1),V={class:"card-body"},A={class:"row row-2 text-muted"},E=(0,i._)("div",{class:"col-4"},"Cantidad:",-1),K={class:"col-6 text-start"},W=(0,i._)("div",{class:"col-4"},"Fecha:",-1),$={class:"col-6 text-start"},q=(0,i._)("div",{class:"col-4"},"Concepto:",-1),J={class:"col-6 text-start"},L={class:"card-footer text-center"};function N(a,t,e,N,O,P){const Q=(0,i.up)("MDBBtn");return(0,i.wg)(),(0,i.iD)("div",s,[(0,i._)("div",l,[(0,i._)("div",o,[r,(0,i._)("div",d,[(0,i._)("div",n,[(0,i._)("div",v,[m,(0,i._)("div",u,[(0,i._)("div",_,[(0,i._)("div",w,[(0,i._)("div",f,[g,(0,i._)("div",p,(0,c.zw)(N.name),1),x,(0,i._)("div",C,(0,c.zw)(N.inicioTime),1),h,(0,i._)("div",H,(0,c.zw)(N.finalTime),1),D,(0,i._)("div",b,(0,c.zw)(N.calaixFetZ),1),z,(0,i._)("div",F,(0,c.zw)(N.descuadre),1),M,(0,i._)("div",T,(0,c.zw)(N.nClientes),1),Z,(0,i._)("div",k,(0,c.zw)(N.recaudado),1),y,(0,i._)("div",j,(0,c.zw)(N.totalDatafono3G),1),U,(0,i._)("div",B,(0,c.zw)(N.cambioInicial),1),I,(0,i._)("div",G,(0,c.zw)(N.cambioFinal),1)])])])])]),(0,i._)("div",Y,[R,((0,i.wg)(!0),(0,i.iD)(i.HY,null,(0,i.Ko)(N.moviments,((a,t)=>((0,i.wg)(),(0,i.iD)("div",{class:"card mb-2",key:t},[(0,i._)("div",V,[(0,i._)("div",A,[E,(0,i._)("div",K,(0,c.zw)(a.valor),1),W,(0,i._)("div",$,(0,c.zw)(a.fecha),1),q,(0,i._)("div",J,(0,c.zw)(a.concepto),1)])])])))),128))])])]),(0,i._)("div",L,[(0,i.Wm)(Q,{color:"primary",class:"w-50",size:"lg",onClick:t[0]||(t[0]=a=>N.imprimirUltimoCierre())},{default:(0,i.w5)((()=>[(0,i.Uk)("Volver a imprimir cierre")])),_:1})])])])])}e(7658);var O=e(4313),P=e(70),Q=e(4870),S={name:"VerUltimoCierreComponent",components:{MDBBtn:O.$v},setup(){const a=(0,Q.iH)(""),t=(0,Q.iH)(0),e=(0,Q.iH)(0),c=(0,Q.iH)(0),s=(0,Q.iH)(0),l=(0,Q.iH)(0),o=(0,Q.iH)(0),r=(0,Q.iH)([]),d=(0,Q.iH)(0),n=(0,Q.iH)(0),v=(0,Q.iH)(0),m=(0,Q.iH)(0),u=(0,Q.iH)(0),_=(0,Q.iH)("");function w(){P.Z.post("caja/imprimirUltimoCierre")}return(0,i.bv)((()=>{P.Z.get("caja/getUltimoCierre").then((i=>{P.Z.post("trabajadores/getTrabajadorById",{id:i.data.idDependientaCierre}).then((t=>{a.value=t.data.nombre}));const m=new Date(i.data.inicioTime),u=new Date(i.data.finalTime);t.value=m.getDate()+"-"+m.getMonth()+"-"+m.getFullYear()+"  "+m.getHours()+":"+m.getMinutes(),e.value=u.getDate()+"-"+u.getMonth()+"-"+u.getFullYear()+"  "+u.getHours()+":"+u.getMinutes(),c.value=i.data.calaixFetZ,l.value=i.data.totalDatafono3G,s.value=i.data.descuadre,o.value=i.data.nClientes,v.value=i.data.recaudado,d.value=i.data.totalApertura,n.value=i.data.totalCierre,P.Z.post("movimientos/getMovimientosIntervalo",{inicio:i.data.inicioTime,final:i.data.finalTime}).then((a=>{a.data&&a.data.forEach((a=>{const t=new Date(a._id),e=t.getDate()+"-"+t.getMonth()+"-"+t.getFullYear()+"  "+t.getHours()+":"+t.getMinutes();r.value.push({fecha:e,concepto:a.concepto,valor:a.valor})}))}))}))})),{name:a,inicioTime:t,finalTime:e,calaixFetZ:c,totalDatafono3G:l,descuadre:s,recaudado:v,nClientes:o,cambioInicial:d,cambioFinal:n,moviments:r,concepto:_,valor:u,fecha:m,imprimirUltimoCierre:w}}},X=e(89);const aa=(0,X.Z)(S,[["render",N]]);var ta=aa}}]);
//# sourceMappingURL=496.7207d362.js.map