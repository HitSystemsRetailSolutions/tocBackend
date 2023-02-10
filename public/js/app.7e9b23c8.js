(function(){"use strict";var e={4171:function(e,t,a){var r=a(9242),o=a(3396);const n={class:"container-fluid"};function s(e,t,a,r,s,i){const c=(0,o.up)("router-view");return(0,o.wg)(),(0,o.iD)("div",n,[(0,o.Wm)(c)])}var i={name:"App",components:{}},c=a(89);const d=(0,c.Z)(i,[["render",s]]);var u=d,l=a(8686),m=a(2781),f=a(70);a(2136),f.Z.defaults.baseURL="http://localhost:3000",(0,r.ri)(u).use(m.Z).use(l.Z).mount("#app")},8686:function(e,t,a){a.d(t,{Z:function(){return b}});var r=a(2483),o=a(3396);const n=e=>((0,o.dD)("data-v-0c8da2e0"),e=e(),(0,o.Cn)(),e),s={class:"vh-100",style:{"background-color":"#1d1d1d"}},i=n((()=>(0,o._)("div",{class:"h-50"},[(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("br"),(0,o._)("div",{class:"pac-man"})],-1))),c=[i];function d(e,t,a,r,n,i){return(0,o.wg)(),(0,o.iD)("div",s,c)}var u=a(4834),l={name:"LoaderComponent",setup(){return setTimeout((function(){u.W.cargarConfiguracion(),u.W.recargarPromosCache(),u.W.cargarCestas(),u.W.cargarVentas(),u.W.cargarTeclado(),u.W.cargarTrabajadoresFichados(),u.W.iniciarToc()}),4e3),{}}},m=a(89);const f=(0,m.Z)(l,[["render",d],["__scopeId","data-v-0c8da2e0"]]);var p=f;const h=[{path:"/",name:"Loader",component:p},{path:"/installWizard",name:"Install Wizard",component:()=>a.e(837).then(a.bind(a,7837))},{path:"/tecnico",name:"Tecnico",component:()=>Promise.all([a.e(313),a.e(584)]).then(a.bind(a,584))},{path:"/abrirCaja",name:"Abrir caja",component:()=>Promise.all([a.e(313),a.e(820)]).then(a.bind(a,5820))},{path:"/main",name:"Main",component:()=>Promise.all([a.e(313),a.e(880)]).then(a.bind(a,1880))},{path:"/cobro",name:"Cobro",component:()=>Promise.all([a.e(313),a.e(134)]).then(a.bind(a,4134))},{path:"/cestas",name:"Cestas",component:()=>Promise.all([a.e(313),a.e(915)]).then(a.bind(a,915))},{path:"/menu",name:"Menu",component:()=>Promise.all([a.e(313),a.e(226)]).then(a.bind(a,226)),children:[{path:"caja",component:()=>Promise.all([a.e(313),a.e(46)]).then(a.bind(a,5046)),children:[{path:"cerrarCaja",component:()=>Promise.all([a.e(313),a.e(506)]).then(a.bind(a,2506))},{path:"tickets",component:()=>Promise.all([a.e(313),a.e(322)]).then(a.bind(a,1322))},{path:"entradaDinero",component:()=>Promise.all([a.e(313),a.e(893)]).then(a.bind(a,5893))},{path:"salidaDinero",component:()=>Promise.all([a.e(313),a.e(995)]).then(a.bind(a,995))},{path:"verUltimoCierre",component:()=>Promise.all([a.e(313),a.e(496)]).then(a.bind(a,9496))}]},{path:"fichajes",component:()=>Promise.all([a.e(313),a.e(879)]).then(a.bind(a,6879))},{path:"pedidos",component:()=>a.e(52).then(a.bind(a,6052))}]}],g=(0,r.p7)({history:(0,r.PO)("/"),routes:h});var b=g},2136:function(e,t,a){a.r(t),a.d(t,{emitSocket:function(){return d},socket:function(){return c}});a(7658);var r=a(2066),o=a(2781),n=a(8686),s=a(2492),i=a.n(s);const c=(0,r.io)("http://localhost:5051");function d(e,t=null){c.connected&&c.emit(e,t)}c.on("cargarConfiguracion",(e=>{try{if(!e)throw Error("Error, parametros no es correcto");o.Z.dispatch("Configuracion/setParametros",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarTrabajadores",(e=>{try{if(!e)throw Error("Error, arrayTrabajadores no es correcto");o.Z.dispatch("Trabajadores/setArrayTrabajadores",e),null!=o.Z.getters["Trabajadores/getIndexActivo"]&&void 0!=o.Z.getters["Trabajadores/getIndexActivo"]||o.Z.dispatch("Trabajadores/setIndexActivo",0)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarCestas",(e=>{try{if(!e)throw Error("Error, arrayCestas no es correcto");o.Z.dispatch("Cestas/setArrayCestasAction",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarVentas",(e=>{try{if(!e)throw Error("Error, arrayTickets no es correcto");o.Z.dispatch("Caja/setArrayVentas",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarTeclado",(e=>{try{if(!e)throw Error("Error, teclado no es correcto");o.Z.dispatch("Teclado/setTeclado",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("disconnect",(()=>{console.log("Desconectado del servidor"),c.sendBuffer=[]})),c.on("test",(e=>{console.log(e)})),c.on("resDatafono",(e=>{console.log(e)})),c.on("resConsultaPuntos",(e=>{0==e.error?i().fire({icon:"info",text:`Puntos del cliente: ${e.info}`}):i().fire("Oops...",e.mensaje,"error")})),c.on("consultaPaytef",(e=>{e?o.Z.dispatch("Datafono/setEstado","APROBADA"):(o.Z.dispatch("Datafono/setEstado","DENEGADA"),setTimeout((()=>{o.Z.dispatch("Datafono/setEstado","AGAIN")}),3e3))})),c.on("consultaPaytefRefund",(e=>{e?i().fire("OK","Devolución aceptada","success"):i().fire("Oops...","Devolución denegada","error")})),c.on("resDatafono",(e=>{o.Z.dispatch("setEsperandoDatafono",!1),0==e.error?(o.Z.dispatch("Cestas/setIdAction",-1),o.Z.dispatch("setModoActual","NORMAL"),o.Z.dispatch("Clientes/resetClienteActivo"),o.Z.dispatch("Footer/resetMenuActivo"),n.Z.push({name:"Home",params:{tipoToast:"success",mensajeToast:"Ticket creado"}})):i().fire("Oops...",e.mensaje,"error")}))},4834:function(e,t,a){a.d(t,{W:function(){return l}});var r=a(2482),o=(a(7658),a(70)),n=a(2492),s=a.n(n),i=a(8686),c=a(2136);const d="http://localhost:3000/";class u{constructor(){(0,r.Z)(this,"cargarTrabajadoresFichados",(()=>(0,c.emitSocket)("cargarTrabajadores"))),(0,r.Z)(this,"cargarCestas",(()=>(0,c.emitSocket)("cargarCestas"))),(0,r.Z)(this,"cargarConfiguracion",(()=>(0,c.emitSocket)("cargarConfiguracion"))),(0,r.Z)(this,"recargarPromosCache",(()=>(0,c.emitSocket)("recargarPromociones"))),(0,r.Z)(this,"cargarVentas",(()=>(0,c.emitSocket)("cargarVentas"))),(0,r.Z)(this,"cargarTeclado",(()=>(0,c.emitSocket)("cargarTeclado")))}async todoInstalado(){try{return(await o.Z.get(d+"parametros/todoInstalado")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async hayFichados(){try{return(await o.Z.get(d+"trabajadores/hayFichados")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async cajaAbierta(){try{return(await o.Z.get(d+"caja/estadoCaja")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async getParametros(){try{return(await o.Z.post(d+"parametros/getParametros")).data}catch(e){return s().fire("Oops...",e.message,"error"),null}}async iniciarToc(){await this.todoInstalado()?await this.hayFichados()?await this.cajaAbierta()?i.Z.push("/main"):i.Z.push("/abrirCaja"):i.Z.push("/menu/fichajes"):i.Z.push("/installWizard")}}const l=new u},2781:function(e,t,a){a.d(t,{Z:function(){return b}});var r=a(65),o={namespaced:!0,state:{arrayTrabajadores:[],indexActivo:null},mutations:{setArrayTrabajadoresMutation(e,t){e.arrayTrabajadores=t},setIndexActivoMutation(e,t){e.indexActivo=t}},getters:{getArrayTrabajadores:e=>e.arrayTrabajadores,getIndexActivo:e=>e.trabajadorActivo,getTrabajadorActivo:e=>e.arrayTrabajadores[e.indexActivo]},actions:{setArrayTrabajadores({commit:e},t){e("setArrayTrabajadoresMutation",t)},setIndexActivo({commit:e},t){e("setIndexActivoMutation",t)}}},n=a(70),s=a(2492),i=a.n(s),c={namespaced:!0,state:{arrayCestas:[],indexItemActivo:null},mutations:{setArrayCestasMutation(e,t){e.arrayCestas=t},setActivoMutation(e,t){e.indexItemActivo=t},deleteIndexMutation(e,{index:t,idCesta:a}){n.Z.post("cestas/borrarItemCesta",{idCesta:a,index:t}).then((t=>{if(!t.data)throw Error("No se ha podido eliminar el artículo de la cesta");e.indexItemActivo=null})).catch((e=>{i().fire("Oops...",e.message,"error")}))},deleteListaMutation(e,t){n.Z.post("cestas/borrarCesta",{idCesta:t}).then((e=>{if(!e.data)throw Error("No se ha podido borrar la lista")})).catch((e=>{i().fire("Oops...",e.message,"error")}))},async setClienteMutation(e,{index:t,idCliente:a,nombreCliente:r}){e.arrayCestas[t].idCliente=a,e.arrayCestas[t].nombreCliente=r,await d(e.arrayCestas[t])},async setModoMutation(e,{modo:t,index:a}){e.arrayCestas[a].modo=t,await d(e.arrayCestas[a])}},getters:{getArrayCestas:e=>e.arrayCestas},actions:{setActivoAction({commit:e},t){e("setActivoMutation",t)},setArrayCestasAction({commit:e},t){e("setArrayCestasMutation",t)},deleteIndex({commit:e},{index:t,idCesta:a}){e("deleteIndexMutation",{index:t,idCesta:a})},deleteLista({commit:e},t){e("deleteListaMutation",t)},setClienteCesta({commit:e},t){e("setClienteMutation",t)},setModoCesta({commit:e},t){e("setModoMutation",t)}}};async function d(e){try{const t=await n.Z.post("cestas/updateCestaInverso",{cesta:e});if(!t.data)throw Error("No se ha podido actualizar la cesta en el servidor")}catch(t){i().fire("Oops...",t.message,"error")}}var u={namespaced:!0,state:{cajaAbierta:!1,arrayVentas:[]},mutations:{setArrayVentasMutation(e,t){e.arrayVentas=t}},getters:{},actions:{setArrayVentas({commit:e},t){e("setArrayVentasMutation",t)}}},l={namespaced:!0,state:{objTeclado:[],indexMenuActivo:0,indexSubmenuActivo:0},mutations:{setTecladoMutation(e,t){e.objTeclado=t},setIndexMenuActivoMutation(e,t){e.indexMenuActivo=t,e.indexSubmenuActivo=0},setIndexSubmenuActivoMutation(e,t){e.indexSubmenuActivo=t}},getters:{getTeclado:e=>e.objTeclado},actions:{setTeclado({commit:e},t){e("setTecladoMutation",t)},setIndexMenuActivo({commit:e},t){e("setIndexMenuActivoMutation",t)},setIndexSubmenuActivo({commit:e},t){e("setIndexSubmenuActivoMutation",t)}}},m=a(4834),f={namespaced:!0,state:{parametros:null},getters:{parametros:e=>e.parametros},mutations:{setParametrosMutation(e,t){e.parametros=t}},actions:{setParametros({commit:e},t){e("setParametrosMutation",t),m.W.cargarConfiguracion()}}},p={namespaced:!0,state:{estado:""},mutations:{setEstadoMutation(e,t){e.estado=t}},actions:{setEstado({commit:e},t){e("setEstadoMutation",t)}}},h={namespaced:!0,state:{vistaEspecial:!1},mutations:{setVistaClienteMutation(e,t){e.vistaEspecial=t},resetMutation(e){e.vistaEspecial=!1}},getters:{},actions:{setVistaCliente({commit:e},t){e("setVistaClienteMutation",t)},reset({commit:e}){e("resetMutation")}}},g={namespaced:!0,state:{unidades:1},mutations:{setUnidadesMutation(e,t){e.unidades=t}},getters:{getUnidades:e=>e.unidades},actions:{setUnidades({commit:e},t){e("setUnidadesMutation",t)}}},b=(0,r.MT)({state:{vistaEspecial:!1},getters:{},mutations:{},actions:{},modules:{Caja:u,Cestas:c,Trabajadores:o,Teclado:l,Configuracion:f,Datafono:p,EstadoDinamico:h,Unidades:g}})}},t={};function a(r){var o=t[r];if(void 0!==o)return o.exports;var n=t[r]={id:r,loaded:!1,exports:{}};return e[r].call(n.exports,n,n.exports,a),n.loaded=!0,n.exports}a.m=e,function(){var e=[];a.O=function(t,r,o,n){if(!r){var s=1/0;for(u=0;u<e.length;u++){r=e[u][0],o=e[u][1],n=e[u][2];for(var i=!0,c=0;c<r.length;c++)(!1&n||s>=n)&&Object.keys(a.O).every((function(e){return a.O[e](r[c])}))?r.splice(c--,1):(i=!1,n<s&&(s=n));if(i){e.splice(u--,1);var d=o();void 0!==d&&(t=d)}}return t}n=n||0;for(var u=e.length;u>0&&e[u-1][2]>n;u--)e[u]=e[u-1];e[u]=[r,o,n]}}(),function(){a.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return a.d(t,{a:t}),t}}(),function(){a.d=function(e,t){for(var r in t)a.o(t,r)&&!a.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}}(),function(){a.f={},a.e=function(e){return Promise.all(Object.keys(a.f).reduce((function(t,r){return a.f[r](e,t),t}),[]))}}(),function(){a.u=function(e){return"js/"+e+"."+{46:"67e9de52",52:"a9953c3b",134:"23169d92",226:"e6a249f8",313:"1aca1dbf",322:"58f57b09",496:"58272422",506:"a35ecd36",584:"fa0eca61",820:"bca63d4e",837:"5d221800",879:"7e169b6b",880:"94a67227",893:"cc9a0efe",915:"12a9c114",995:"2025addb"}[e]+".js"}}(),function(){a.miniCssF=function(e){return"css/"+e+"."+{46:"fdc88f50",134:"0e6b3395",226:"c6fbc710",322:"603db346",506:"2c14b51d",820:"4981e17e",837:"d5d08322",879:"ff4fb66a",880:"703e4121",893:"d6660cf7",915:"8d226491",995:"fbeefc35"}[e]+".css"}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){var e={},t="toc-game-v4:";a.l=function(r,o,n,s){if(e[r])e[r].push(o);else{var i,c;if(void 0!==n)for(var d=document.getElementsByTagName("script"),u=0;u<d.length;u++){var l=d[u];if(l.getAttribute("src")==r||l.getAttribute("data-webpack")==t+n){i=l;break}}i||(c=!0,i=document.createElement("script"),i.charset="utf-8",i.timeout=120,a.nc&&i.setAttribute("nonce",a.nc),i.setAttribute("data-webpack",t+n),i.src=r),e[r]=[o];var m=function(t,a){i.onerror=i.onload=null,clearTimeout(f);var o=e[r];if(delete e[r],i.parentNode&&i.parentNode.removeChild(i),o&&o.forEach((function(e){return e(a)})),t)return t(a)},f=setTimeout(m.bind(null,void 0,{type:"timeout",target:i}),12e4);i.onerror=m.bind(null,i.onerror),i.onload=m.bind(null,i.onload),c&&document.head.appendChild(i)}}}(),function(){a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){a.nmd=function(e){return e.paths=[],e.children||(e.children=[]),e}}(),function(){a.p="/"}(),function(){var e=function(e,t,a,r){var o=document.createElement("link");o.rel="stylesheet",o.type="text/css";var n=function(n){if(o.onerror=o.onload=null,"load"===n.type)a();else{var s=n&&("load"===n.type?"missing":n.type),i=n&&n.target&&n.target.href||t,c=new Error("Loading CSS chunk "+e+" failed.\n("+i+")");c.code="CSS_CHUNK_LOAD_FAILED",c.type=s,c.request=i,o.parentNode.removeChild(o),r(c)}};return o.onerror=o.onload=n,o.href=t,document.head.appendChild(o),o},t=function(e,t){for(var a=document.getElementsByTagName("link"),r=0;r<a.length;r++){var o=a[r],n=o.getAttribute("data-href")||o.getAttribute("href");if("stylesheet"===o.rel&&(n===e||n===t))return o}var s=document.getElementsByTagName("style");for(r=0;r<s.length;r++){o=s[r],n=o.getAttribute("data-href");if(n===e||n===t)return o}},r=function(r){return new Promise((function(o,n){var s=a.miniCssF(r),i=a.p+s;if(t(s,i))return o();e(r,i,o,n)}))},o={143:0};a.f.miniCss=function(e,t){var a={46:1,134:1,226:1,322:1,506:1,820:1,837:1,879:1,880:1,893:1,915:1,995:1};o[e]?t.push(o[e]):0!==o[e]&&a[e]&&t.push(o[e]=r(e).then((function(){o[e]=0}),(function(t){throw delete o[e],t})))}}(),function(){var e={143:0};a.f.j=function(t,r){var o=a.o(e,t)?e[t]:void 0;if(0!==o)if(o)r.push(o[2]);else{var n=new Promise((function(a,r){o=e[t]=[a,r]}));r.push(o[2]=n);var s=a.p+a.u(t),i=new Error,c=function(r){if(a.o(e,t)&&(o=e[t],0!==o&&(e[t]=void 0),o)){var n=r&&("load"===r.type?"missing":r.type),s=r&&r.target&&r.target.src;i.message="Loading chunk "+t+" failed.\n("+n+": "+s+")",i.name="ChunkLoadError",i.type=n,i.request=s,o[1](i)}};a.l(s,c,"chunk-"+t,t)}},a.O.j=function(t){return 0===e[t]};var t=function(t,r){var o,n,s=r[0],i=r[1],c=r[2],d=0;if(s.some((function(t){return 0!==e[t]}))){for(o in i)a.o(i,o)&&(a.m[o]=i[o]);if(c)var u=c(a)}for(t&&t(r);d<s.length;d++)n=s[d],a.o(e,n)&&e[n]&&e[n][0](),e[n]=0;return a.O(u)},r=self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[];r.forEach(t.bind(null,0)),r.push=t.bind(null,r.push.bind(r))}();var r=a.O(void 0,[998],(function(){return a(4171)}));r=a.O(r)})();
//# sourceMappingURL=app.7e9b23c8.js.map