"use strict";(self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[]).push([[226],{226:function(e,a,t){t.r(a),t.d(a,{default:function(){return k}});var o=t(3396),n=t(7139);const s={class:"margenLateral position-relative"},i={class:"position-absolute bottom-0 start-0 mb-1 mt-4"},r={class:"sizeTrabajadores"},l={class:"btn-group",role:"group"},u=["onClick"];function c(e,a,t,c,d,m){const v=(0,o.up)("LateralComponent"),p=(0,o.up)("router-view");return(0,o.wg)(),(0,o.iD)(o.HY,null,[(0,o.Wm)(v),(0,o._)("div",s,[(0,o.Wm)(p),(0,o._)("div",i,[(0,o._)("div",r,[(0,o._)("div",l,[((0,o.wg)(!0),(0,o.iD)(o.HY,null,(0,o.Ko)(c.arrayTrabajadores,((e,a)=>((0,o.wg)(),(0,o.iD)("button",{key:a,type:"button",class:(0,n.C_)(["btn btn-lg sizeBotonesTrabajador d-inline-block text-truncate me-2",[a===c.indexActivo?"btn-primary":"btn-outline-primary"]]),onClick:e=>c.setIndexActivo(a)},(0,n.zw)(e.nombre),11,u)))),128))])])])])],64)}function d(e,a,t,s,i,r){const l=(0,o.up)("MDBIcon"),u=(0,o.up)("MDBSideNavItem"),c=(0,o.up)("MDBSideNavMenu"),d=(0,o.up)("MDBSideNav");return(0,o.wg)(),(0,o.j4)(d,{modelValue:s.sidenavPositions,"onUpdate:modelValue":a[6]||(a[6]=e=>s.sidenavPositions=e),id:"sidenavPositions",mode:s.mode,slim:!0,backdrop:!1},{default:(0,o.w5)((()=>[(0,o.Wm)(c,{class:"mx-auto text-center"},{default:(0,o.w5)((()=>[(0,o.Wm)(u,{onClick:a[0]||(a[0]=e=>s.goTo("/main"))},{default:(0,o.w5)((()=>[(0,o.Wm)(l,{icon:"money-bill-alt",size:"5x"})])),_:1}),(0,o.Wm)(u,{class:(0,n.C_)(["mt-5",{activo:s.router.currentRoute.value.path.startsWith("/menu/caja")}]),onClick:a[1]||(a[1]=e=>s.goTo("/menu/caja"))},{default:(0,o.w5)((()=>[(0,o.Wm)(l,{icon:"piggy-bank",size:"5x"})])),_:1},8,["class"]),(0,o.Wm)(u,{onClick:a[2]||(a[2]=e=>s.goTo("/menu/fichajes")),class:(0,n.C_)(["mt-5",{activo:s.router.currentRoute.value.path.startsWith("/menu/fichajes")}])},{default:(0,o.w5)((()=>[(0,o.Wm)(l,{icon:"door-open",size:"5x"})])),_:1},8,["class"]),(0,o.Wm)(u,{onClick:a[3]||(a[3]=e=>s.activarDevolucion()),class:(0,n.C_)(["mt-5",{activo:s.router.currentRoute.value.path.startsWith("/menu/devolver")}])},{default:(0,o.w5)((()=>[(0,o.Wm)(l,{icon:"trash-alt",size:"5x"})])),_:1},8,["class"]),(0,o.Wm)(u,{onClick:a[4]||(a[4]=e=>s.goTo("/menu/pedidos")),class:(0,n.C_)(["mt-5",{activo:s.router.currentRoute.value.path.startsWith("/menu/pedido")}])},{default:(0,o.w5)((()=>[(0,o.Wm)(l,{icon:"globe",size:"5x"})])),_:1},8,["class"]),(0,o.Wm)(u,{onClick:a[5]||(a[5]=e=>s.goTo("/tecnico")),class:"mt-5"},{default:(0,o.w5)((()=>[(0,o.Wm)(l,{icon:"key",size:"5x"})])),_:1})])),_:1})])),_:1},8,["modelValue","mode"])}t(7658);var m=t(4313),v=t(4870),p=t(2483),b=t(65),f={name:"LateralComponent",components:{MDBSideNav:m.Bv,MDBSideNavMenu:m.g5,MDBSideNavItem:m.Yx,MDBIcon:m.vm},setup(){const e=(0,p.tv)(),a=(0,b.oR)(),t=(0,v.iH)(!0),n=(0,v.iH)("over"),s=e=>{n.value=e},i=(0,o.Fl)((()=>a.state.Cestas.arrayCestas)),r=(0,o.Fl)((()=>a.state.Trabajadores.arrayTrabajadores)),l=(0,o.Fl)((()=>a.state.Trabajadores.indexActivo)),u=(0,o.Fl)((()=>{if(i.value)for(let e=0;e<i.value.length;e++)if(i.value[e]._id==r.value[l.value].idCesta)return i.value[e];return null}));function c(a){e.push(a)}async function d(){if(i.value&&u.value)for(let t=0;t<i.value.length;t++)if(u.value._id===i.value[t]._id){await a.dispatch("Cestas/setModoCesta",{modo:"DEVOLUCION",index:t}),e.push("/main");break}}return{sidenavPositions:t,mode:n,setMode:s,router:e,goTo:c,activarDevolucion:d}}},_=t(89);const C=(0,_.Z)(f,[["render",d]]);var g=C,h={name:"MenuPrincipalView",components:{LateralComponent:g},setup(){const e=(0,b.oR)(),a=(0,o.Fl)((()=>e.state.Trabajadores.arrayTrabajadores)),t=(0,o.Fl)((()=>e.state.Trabajadores.indexActivo));function n(a){e.dispatch("Trabajadores/setIndexActivo",a)}return{arrayTrabajadores:a,setIndexActivo:n,indexActivo:t}}};const W=(0,_.Z)(h,[["render",c],["__scopeId","data-v-627811c2"]]);var k=W}}]);
//# sourceMappingURL=226.341647d1.js.map