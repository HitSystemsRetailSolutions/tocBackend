(function(){"use strict";var e={9494:function(e,t,a){var o=a(9242),r=a(3396);const n={class:"container-fluid"};function s(e,t,a,o,s,i){const c=(0,r.up)("router-view");return(0,r.wg)(),(0,r.iD)("div",n,[(0,r.Wm)(c)])}var i=a(5658),c={name:"App",components:{},setup(){const{t:e}=(0,i.QT)();return{t:e}}},d=a(89);const u=(0,d.Z)(c,[["render",s]]);var l=u,m=a(8686),f=a(2781),p=a(4311);const h=()=>fetch("http://localhost:3000/traducciones/getTraducciones").then((e=>e.json())).then((e=>e));a(2136),p.Z.defaults.baseURL="http://localhost:3000",h().then((e=>{const t=e.reduce(((e,t)=>(t.languages.forEach((a=>{const o=Object.keys(a)[0],r=a[o];e[o]||(e[o]={}),e[o][t.key]=r})),e)),{}),a=(0,i.o)({legacy:!1,locale:"es",messages:t});(0,o.ri)(l).use(f.Z).use(m.Z).use(a).mount("#app")})).catch((e=>{console.log(e),(0,o.ri)(l).use(f.Z).use(m.Z).mount("#app")}))},8686:function(e,t,a){a.d(t,{Z:function(){return b}});var o=a(2483),r=a(3396);const n=e=>((0,r.dD)("data-v-0c8da2e0"),e=e(),(0,r.Cn)(),e),s={class:"vh-100",style:{"background-color":"#1d1d1d"}},i=n((()=>(0,r._)("div",{class:"h-50"},[(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("br"),(0,r._)("div",{class:"pac-man"})],-1))),c=[i];function d(e,t,a,o,n,i){return(0,r.wg)(),(0,r.iD)("div",s,c)}var u=a(4834),l={name:"LoaderComponent",setup(){return setTimeout((function(){u.W.cargarConfiguracion(),u.W.recargarPromosCache(),u.W.cargarCestas(),u.W.cargarVentas(),u.W.cargarTeclado(),u.W.cargarTrabajadoresFichados(),u.W.iniciarToc()}),4e3),{}}},m=a(89);const f=(0,m.Z)(l,[["render",d],["__scopeId","data-v-0c8da2e0"]]);var p=f;const h=[{path:"/",name:"Loader",component:p},{path:"/installWizard",name:"Install Wizard",component:()=>a.e(837).then(a.bind(a,7837))},{path:"/tecnico",name:"Tecnico",component:()=>Promise.all([a.e(313),a.e(584)]).then(a.bind(a,584))},{path:"/abrirCaja",name:"Abrir caja",component:()=>Promise.all([a.e(313),a.e(820)]).then(a.bind(a,5820))},{path:"/main",name:"Main",component:()=>Promise.all([a.e(313),a.e(572)]).then(a.bind(a,3572))},{path:"/cobro",name:"Cobro",component:()=>Promise.all([a.e(313),a.e(134)]).then(a.bind(a,4134))},{path:"/cestas",name:"Cestas",component:()=>Promise.all([a.e(313),a.e(434)]).then(a.bind(a,6434))},{path:"/menu",name:"Menu",component:()=>Promise.all([a.e(313),a.e(226)]).then(a.bind(a,226)),children:[{path:"caja",component:()=>Promise.all([a.e(313),a.e(46)]).then(a.bind(a,5046)),children:[{path:"cerrarCaja",component:()=>Promise.all([a.e(313),a.e(506)]).then(a.bind(a,2506))},{path:"tickets",component:()=>Promise.all([a.e(313),a.e(122)]).then(a.bind(a,3122))},{path:"entradaDinero",component:()=>Promise.all([a.e(313),a.e(945)]).then(a.bind(a,2945))},{path:"salidaDinero",component:()=>Promise.all([a.e(313),a.e(995)]).then(a.bind(a,995))},{path:"verUltimoCierre",component:()=>Promise.all([a.e(313),a.e(710)]).then(a.bind(a,7710))}]},{path:"fichajes",component:()=>Promise.all([a.e(313),a.e(879)]).then(a.bind(a,6879))},{path:"pedidos",component:()=>a.e(52).then(a.bind(a,6052))}]}],g=(0,o.p7)({history:(0,o.PO)("/"),routes:h});var b=g},2136:function(e,t,a){a.r(t),a.d(t,{emitSocket:function(){return d},socket:function(){return c}});a(7658);var o=a(2066),r=a(2781),n=a(8686),s=a(2492),i=a.n(s);const c=(0,o.io)("http://localhost:5051");function d(e,t=null){c.connected&&c.emit(e,t)}c.on("cargarConfiguracion",(e=>{try{if(!e)throw Error("Error, parametros no es correcto");r.Z.dispatch("Configuracion/setParametros",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarTrabajadores",(e=>{try{if(!e)throw Error("Error, arrayTrabajadores no es correcto");r.Z.dispatch("Trabajadores/setArrayTrabajadores",e),null!=r.Z.getters["Trabajadores/getIndexActivo"]&&void 0!=r.Z.getters["Trabajadores/getIndexActivo"]||r.Z.dispatch("Trabajadores/setIndexActivo",0),console.log("socket",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarCestas",(e=>{try{if(!e)throw Error("Error, arrayCestas no es correcto");r.Z.dispatch("Cestas/setArrayCestasAction",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarVentas",(e=>{try{if(!e)throw Error("Error, arrayTickets no es correcto");r.Z.dispatch("Caja/setArrayVentas",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("cargarTeclado",(e=>{try{if(!e)throw Error("Error, teclado no es correcto");r.Z.dispatch("Teclado/setTeclado",e)}catch(t){console.log(t),i().fire("Oops...",t.message,"error")}})),c.on("disconnect",(()=>{console.log("Desconectado del servidor"),c.sendBuffer=[]})),c.on("test",(e=>{console.log(e)})),c.on("resDatafono",(e=>{console.log(e)})),c.on("resConsultaPuntos",(e=>{0==e.error?i().fire({icon:"info",text:`Puntos del cliente: ${e.info}`}):i().fire("Oops...",e.mensaje,"error")})),c.on("consultaPaytef",(e=>{e?r.Z.dispatch("Datafono/setEstado","APROBADA"):(r.Z.dispatch("Datafono/setEstado","DENEGADA"),setTimeout((()=>{r.Z.dispatch("Datafono/setEstado","AGAIN")}),3e3))})),c.on("consultaPaytefRefund",(e=>{e.ok&&i().fire("OK","Devolución aceptada","success")})),c.on("resDatafono",(e=>{r.Z.dispatch("setEsperandoDatafono",!1),0==e.error?(r.Z.dispatch("Cestas/setIdAction",-1),r.Z.dispatch("setModoActual","NORMAL"),r.Z.dispatch("Clientes/resetClienteActivo"),r.Z.dispatch("Footer/resetMenuActivo"),n.Z.push({name:"Home",params:{tipoToast:"success",mensajeToast:"Ticket creado"}})):i().fire("Oops...",e.mensaje,"error")}))},4834:function(e,t,a){a.d(t,{W:function(){return l}});var o=a(7327),r=(a(7658),a(4311)),n=a(2492),s=a.n(n),i=a(8686),c=a(2136);const d="http://localhost:3000/";class u{constructor(){(0,o.Z)(this,"cargarTrabajadoresFichados",(()=>(0,c.emitSocket)("cargarTrabajadores"))),(0,o.Z)(this,"cargarCestas",(()=>(0,c.emitSocket)("cargarCestas"))),(0,o.Z)(this,"cargarConfiguracion",(()=>(0,c.emitSocket)("cargarConfiguracion"))),(0,o.Z)(this,"recargarPromosCache",(()=>(0,c.emitSocket)("recargarPromociones"))),(0,o.Z)(this,"cargarVentas",(()=>(0,c.emitSocket)("cargarVentas"))),(0,o.Z)(this,"cargarTeclado",(()=>(0,c.emitSocket)("cargarTeclado")))}async todoInstalado(){try{return(await r.Z.get(d+"parametros/todoInstalado")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async hayFichados(){try{return(await r.Z.get(d+"trabajadores/hayFichados")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async cajaAbierta(){try{return(await r.Z.get(d+"caja/estadoCaja")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async getParametros(){try{return(await r.Z.post(d+"parametros/getParametros")).data}catch(e){return s().fire("Oops...",e.message,"error"),null}}async iniciarToc(){await this.todoInstalado()?await this.hayFichados()?await this.cajaAbierta()?i.Z.push("/main"):i.Z.push("/abrirCaja"):i.Z.push("/menu/fichajes"):i.Z.push("/installWizard")}}const l=new u},2781:function(e,t,a){a.d(t,{Z:function(){return b}});var o=a(65),r={namespaced:!0,state:{arrayTrabajadores:[],indexActivo:null},mutations:{setArrayTrabajadoresMutation(e,t){e.arrayTrabajadores=t},setIndexActivoMutation(e,t){e.indexActivo=t}},getters:{getArrayTrabajadores:e=>e.arrayTrabajadores,getIndexActivo:e=>e.trabajadorActivo,getTrabajadorActivo:e=>e.arrayTrabajadores[e.indexActivo]},actions:{setArrayTrabajadores({commit:e},t){e("setArrayTrabajadoresMutation",t)},setIndexActivo({commit:e},t){e("setIndexActivoMutation",t)}}},n=a(4311),s=a(2492),i=a.n(s),c={namespaced:!0,state:{arrayCestas:[],indexItemActivo:null},mutations:{setArrayCestasMutation(e,t){e.arrayCestas=t},setActivoMutation(e,t){e.indexItemActivo=t},deleteIndexMutation(e,{index:t,idCesta:a}){n.Z.post("cestas/borrarItemCesta",{idCesta:a,index:t}).then((t=>{if(!t.data)throw Error("No se ha podido eliminar el artículo de la cesta");e.indexItemActivo=null})).catch((e=>{i().fire("Oops...",e.message,"error")}))},deleteListaMutation(e,t){n.Z.post("cestas/borrarCesta",{idCesta:t}).then((e=>{if(!e.data)throw Error("No se ha podido borrar la lista")})).catch((e=>{i().fire("Oops...",e.message,"error")}))},async setClienteMutation(e,{index:t,idCliente:a,nombreCliente:o}){e.arrayCestas[t].idCliente=a,e.arrayCestas[t].nombreCliente=o,await d(e.arrayCestas[t])},async setModoMutation(e,{modo:t,index:a}){e.arrayCestas[a].modo=t,await d(e.arrayCestas[a])}},getters:{getArrayCestas:e=>e.arrayCestas},actions:{setActivoAction({commit:e},t){e("setActivoMutation",t)},setArrayCestasAction({commit:e},t){e("setArrayCestasMutation",t)},deleteIndex({commit:e},{index:t,idCesta:a}){e("deleteIndexMutation",{index:t,idCesta:a})},deleteLista({commit:e},t){e("deleteListaMutation",t)},setClienteCesta({commit:e},t){e("setClienteMutation",t)},setModoCesta({commit:e},t){e("setModoMutation",t)}}};async function d(e){try{const t=await n.Z.post("cestas/updateCestaInverso",{cesta:e});if(!t.data)throw Error("No se ha podido actualizar la cesta en el servidor")}catch(t){i().fire("Oops...",t.message,"error")}}var u={namespaced:!0,state:{cajaAbierta:!1,arrayVentas:[]},mutations:{setArrayVentasMutation(e,t){e.arrayVentas=t}},getters:{},actions:{setArrayVentas({commit:e},t){e("setArrayVentasMutation",t)}}},l={namespaced:!0,state:{objTeclado:[],indexMenuActivo:0,indexSubmenuActivo:0},mutations:{setTecladoMutation(e,t){e.objTeclado=t},setIndexMenuActivoMutation(e,t){e.indexMenuActivo=t,e.indexSubmenuActivo=0},setIndexSubmenuActivoMutation(e,t){e.indexSubmenuActivo=t}},getters:{getTeclado:e=>e.objTeclado},actions:{setTeclado({commit:e},t){e("setTecladoMutation",t)},setIndexMenuActivo({commit:e},t){e("setIndexMenuActivoMutation",t)},setIndexSubmenuActivo({commit:e},t){e("setIndexSubmenuActivoMutation",t)}}},m=a(4834),f={namespaced:!0,state:{parametros:null},getters:{parametros:e=>e.parametros},mutations:{setParametrosMutation(e,t){e.parametros=t}},actions:{setParametros({commit:e},t){e("setParametrosMutation",t),m.W.cargarConfiguracion()}}},p={namespaced:!0,state:{estado:""},mutations:{setEstadoMutation(e,t){e.estado=t}},actions:{setEstado({commit:e},t){e("setEstadoMutation",t)}}},h={namespaced:!0,state:{vistaEspecial:!1},mutations:{setVistaClienteMutation(e,t){e.vistaEspecial=t},resetMutation(e){e.vistaEspecial=!1}},getters:{},actions:{setVistaCliente({commit:e},t){e("setVistaClienteMutation",t)},reset({commit:e}){e("resetMutation")}}},g={namespaced:!0,state:{unidades:1},mutations:{setUnidadesMutation(e,t){e.unidades=t}},getters:{getUnidades:e=>e.unidades},actions:{setUnidades({commit:e},t){e("setUnidadesMutation",t)}}},b=(0,o.MT)({state:{vistaEspecial:!1},getters:{},mutations:{},actions:{},modules:{Caja:u,Cestas:c,Trabajadores:r,Teclado:l,Configuracion:f,Datafono:p,EstadoDinamico:h,Unidades:g}})}},t={};function a(o){var r=t[o];if(void 0!==r)return r.exports;var n=t[o]={id:o,loaded:!1,exports:{}};return e[o].call(n.exports,n,n.exports,a),n.loaded=!0,n.exports}a.m=e,function(){var e=[];a.O=function(t,o,r,n){if(!o){var s=1/0;for(u=0;u<e.length;u++){o=e[u][0],r=e[u][1],n=e[u][2];for(var i=!0,c=0;c<o.length;c++)(!1&n||s>=n)&&Object.keys(a.O).every((function(e){return a.O[e](o[c])}))?o.splice(c--,1):(i=!1,n<s&&(s=n));if(i){e.splice(u--,1);var d=r();void 0!==d&&(t=d)}}return t}n=n||0;for(var u=e.length;u>0&&e[u-1][2]>n;u--)e[u]=e[u-1];e[u]=[o,r,n]}}(),function(){a.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return a.d(t,{a:t}),t}}(),function(){a.d=function(e,t){for(var o in t)a.o(t,o)&&!a.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}}(),function(){a.f={},a.e=function(e){return Promise.all(Object.keys(a.f).reduce((function(t,o){return a.f[o](e,t),t}),[]))}}(),function(){a.u=function(e){return"js/"+e+"."+{46:"f3b82212",52:"904d743a",122:"ae2ce4c9",134:"752770cc",226:"85967332",313:"a08393d6",434:"4877b1d8",506:"f4ac1c0c",572:"fb13bd80",584:"5e7fb61d",710:"58bc8683",820:"36292e95",837:"9a61a577",879:"c1382dae",945:"6a577b62",995:"b03898f8"}[e]+".js"}}(),function(){a.miniCssF=function(e){return"css/"+e+"."+{46:"fdc88f50",122:"e98c3d7b",134:"0e6b3395",226:"c6fbc710",434:"d9735e5e",506:"2c14b51d",572:"65c40022",820:"4981e17e",837:"d5d08322",879:"ff4fb66a",945:"0ffa3323",995:"fbeefc35"}[e]+".css"}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){var e={},t="toc-game-v4:";a.l=function(o,r,n,s){if(e[o])e[o].push(r);else{var i,c;if(void 0!==n)for(var d=document.getElementsByTagName("script"),u=0;u<d.length;u++){var l=d[u];if(l.getAttribute("src")==o||l.getAttribute("data-webpack")==t+n){i=l;break}}i||(c=!0,i=document.createElement("script"),i.charset="utf-8",i.timeout=120,a.nc&&i.setAttribute("nonce",a.nc),i.setAttribute("data-webpack",t+n),i.src=o),e[o]=[r];var m=function(t,a){i.onerror=i.onload=null,clearTimeout(f);var r=e[o];if(delete e[o],i.parentNode&&i.parentNode.removeChild(i),r&&r.forEach((function(e){return e(a)})),t)return t(a)},f=setTimeout(m.bind(null,void 0,{type:"timeout",target:i}),12e4);i.onerror=m.bind(null,i.onerror),i.onload=m.bind(null,i.onload),c&&document.head.appendChild(i)}}}(),function(){a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){a.nmd=function(e){return e.paths=[],e.children||(e.children=[]),e}}(),function(){a.p="/"}(),function(){if("undefined"!==typeof document){var e=function(e,t,a,o,r){var n=document.createElement("link");n.rel="stylesheet",n.type="text/css";var s=function(a){if(n.onerror=n.onload=null,"load"===a.type)o();else{var s=a&&("load"===a.type?"missing":a.type),i=a&&a.target&&a.target.href||t,c=new Error("Loading CSS chunk "+e+" failed.\n("+i+")");c.code="CSS_CHUNK_LOAD_FAILED",c.type=s,c.request=i,n.parentNode.removeChild(n),r(c)}};return n.onerror=n.onload=s,n.href=t,a?a.parentNode.insertBefore(n,a.nextSibling):document.head.appendChild(n),n},t=function(e,t){for(var a=document.getElementsByTagName("link"),o=0;o<a.length;o++){var r=a[o],n=r.getAttribute("data-href")||r.getAttribute("href");if("stylesheet"===r.rel&&(n===e||n===t))return r}var s=document.getElementsByTagName("style");for(o=0;o<s.length;o++){r=s[o],n=r.getAttribute("data-href");if(n===e||n===t)return r}},o=function(o){return new Promise((function(r,n){var s=a.miniCssF(o),i=a.p+s;if(t(s,i))return r();e(o,i,null,r,n)}))},r={143:0};a.f.miniCss=function(e,t){var a={46:1,122:1,134:1,226:1,434:1,506:1,572:1,820:1,837:1,879:1,945:1,995:1};r[e]?t.push(r[e]):0!==r[e]&&a[e]&&t.push(r[e]=o(e).then((function(){r[e]=0}),(function(t){throw delete r[e],t})))}}}(),function(){var e={143:0};a.f.j=function(t,o){var r=a.o(e,t)?e[t]:void 0;if(0!==r)if(r)o.push(r[2]);else{var n=new Promise((function(a,o){r=e[t]=[a,o]}));o.push(r[2]=n);var s=a.p+a.u(t),i=new Error,c=function(o){if(a.o(e,t)&&(r=e[t],0!==r&&(e[t]=void 0),r)){var n=o&&("load"===o.type?"missing":o.type),s=o&&o.target&&o.target.src;i.message="Loading chunk "+t+" failed.\n("+n+": "+s+")",i.name="ChunkLoadError",i.type=n,i.request=s,r[1](i)}};a.l(s,c,"chunk-"+t,t)}},a.O.j=function(t){return 0===e[t]};var t=function(t,o){var r,n,s=o[0],i=o[1],c=o[2],d=0;if(s.some((function(t){return 0!==e[t]}))){for(r in i)a.o(i,r)&&(a.m[r]=i[r]);if(c)var u=c(a)}for(t&&t(o);d<s.length;d++)n=s[d],a.o(e,n)&&e[n]&&e[n][0](),e[n]=0;return a.O(u)},o=self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[];o.forEach(t.bind(null,0)),o.push=t.bind(null,o.push.bind(o))}();var o=a.O(void 0,[998],(function(){return a(9494)}));o=a.O(o)})();
//# sourceMappingURL=app.9a83d842.js.map