(function(){"use strict";var e={4171:function(e,t,a){var o=a(9242),n=a(3396);const r={class:"container-fluid"};function s(e,t,a,o,s,i){const c=(0,n.up)("router-view");return(0,n.wg)(),(0,n.iD)("div",r,[(0,n.Wm)(c)])}var i={name:"App",components:{}},c=a(89);const d=(0,c.Z)(i,[["render",s]]);var u=d,l=a(5752),m=a(2781),f=a(4677),p=a(70);a(2136),p.Z.defaults.baseURL="http://"+window.location.hostname+":3000/",(0,o.ri)(u).use(f.ZP,{position:"bottom-center",timeout:1500}).use(m.Z).use(l.Z).mount("#app")},5752:function(e,t,a){a.d(t,{Z:function(){return v}});var o=a(2483),n=a(3396);const r=e=>((0,n.dD)("data-v-18b77d4c"),e=e(),(0,n.Cn)(),e),s={class:"vh-100",style:{"background-color":"#1d1d1d"}},i=r((()=>(0,n._)("div",{class:"h-50"},[(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("br"),(0,n._)("div",{class:"pac-man"})],-1))),c=[i];function d(e,t,a,o,r,i){return(0,n.wg)(),(0,n.iD)("div",s,c)}var u=a(4834),l={name:"LoaderComponent",setup(){return setTimeout((function(){u.W.cargarCestas(),u.W.cargarVentas(),u.W.cargarTeclado(),u.W.cargarTrabajadoresFichados(),u.W.iniciarToc()}),4e3),{}}},m=a(89);const f=(0,m.Z)(l,[["render",d],["__scopeId","data-v-18b77d4c"]]);var p=f;const h=[{path:"/",name:"Loader",component:p},{path:"/installWizard",name:"Install Wizard",component:()=>a.e(837).then(a.bind(a,7837))},{path:"/tecnico",name:"Tecnico",component:()=>Promise.all([a.e(313),a.e(836)]).then(a.bind(a,7836))},{path:"/abrirCaja",name:"Abrir caja",component:()=>Promise.all([a.e(313),a.e(820)]).then(a.bind(a,5820))},{path:"/main",name:"Main",component:()=>Promise.all([a.e(313),a.e(472)]).then(a.bind(a,472))},{path:"/cobro",name:"Cobro",component:()=>Promise.all([a.e(313),a.e(134)]).then(a.bind(a,4134))},{path:"/cestas",name:"Cestas",component:()=>Promise.all([a.e(313),a.e(986)]).then(a.bind(a,9986))},{path:"/menu",name:"Menu",component:()=>Promise.all([a.e(313),a.e(226)]).then(a.bind(a,226)),children:[{path:"caja",component:()=>Promise.all([a.e(313),a.e(477)]).then(a.bind(a,477)),children:[{path:"cerrarCaja",component:()=>Promise.all([a.e(313),a.e(506)]).then(a.bind(a,2506))},{path:"tickets",component:()=>Promise.all([a.e(313),a.e(780)]).then(a.bind(a,1780))},{path:"entradaDinero",component:()=>Promise.all([a.e(313),a.e(893)]).then(a.bind(a,5893))},{path:"salidaDinero",component:()=>Promise.all([a.e(313),a.e(995)]).then(a.bind(a,995))},{path:"verUltimoCierre",component:()=>Promise.all([a.e(313),a.e(496)]).then(a.bind(a,9496))}]},{path:"fichajes",component:()=>Promise.all([a.e(313),a.e(879)]).then(a.bind(a,6879))},{path:"pedidos",component:()=>a.e(52).then(a.bind(a,6052))}]}],b=(0,o.p7)({history:(0,o.PO)("/"),routes:h});var v=b},2136:function(e,t,a){a.r(t),a.d(t,{emitSocket:function(){return l},socket:function(){return d}});a(7658);var o=a(2066),n=a(4677),r=a(2781),s=a(5752),i=a(2492),c=a.n(i);const d=(0,o.io)("http://"+window.location.hostname+":5051"),u=(0,n.pm)();function l(e,t=null){d.connected&&d.emit(e,t)}d.on("cargarTrabajadores",(e=>{try{if(!e)throw Error("Error, arrayTrabajadores no es correcto");r.Z.dispatch("Trabajadores/setArrayTrabajadores",e),null!=r.Z.getters["Trabajadores/getIndexActivo"]&&void 0!=r.Z.getters["Trabajadores/getIndexActivo"]||r.Z.dispatch("Trabajadores/setIndexActivo",0)}catch(t){console.log(t),u.error(t.message)}})),d.on("cargarCestas",(e=>{try{if(!e)throw Error("Error, arrayCestas no es correcto");r.Z.dispatch("Cestas/setArrayCestasAction",e)}catch(t){console.log(t),u.error(t.message)}})),d.on("cargarVentas",(e=>{try{if(!e)throw Error("Error, arrayTickets no es correcto");r.Z.dispatch("Caja/setArrayVentas",e)}catch(t){console.log(t),u.error(t.message)}})),d.on("cargarTeclado",(e=>{try{if(!e)throw Error("Error, teclado no es correcto");r.Z.dispatch("Teclado/setTeclado",e)}catch(t){console.log(t),u.error(t.message)}})),d.on("disconnect",(()=>{console.log("Desconectado del servidor"),d.sendBuffer=[]})),d.on("test",(e=>{console.log(e)})),d.on("resDatafono",(e=>{console.log(e)})),d.on("resConsultaPuntos",(e=>{0==e.error?u.info(`Puntos del cliente: ${e.info}`):u.error(e.mensaje)})),d.on("consultaPaytef",(e=>{e?r.Z.dispatch("Datafono/setEstado","APROBADA"):(r.Z.dispatch("Datafono/setEstado","DENEGADA"),setTimeout((()=>{r.Z.dispatch("Datafono/setEstado","AGAIN")}),3e3))})),d.on("consultaPaytefRefund",(e=>{e?c().fire("OK","Devolución aceptada","success"):c().fire("Oops...","Devolución denegada","error")})),d.on("resDatafono",(e=>{r.Z.dispatch("setEsperandoDatafono",!1),0==e.error?(r.Z.dispatch("Cestas/setIdAction",-1),r.Z.dispatch("setModoActual","NORMAL"),r.Z.dispatch("Clientes/resetClienteActivo"),r.Z.dispatch("Footer/resetMenuActivo"),s.Z.push({name:"Home",params:{tipoToast:"success",mensajeToast:"Ticket creado"}})):u.error(e.mensaje)}))},4834:function(e,t,a){a.d(t,{W:function(){return l}});var o=a(2482),n=(a(7658),a(70)),r=a(2492),s=a.n(r),i=a(5752),c=a(2136);const d="http://"+window.location.hostname+":3000/";console.log(d);class u{constructor(){(0,o.Z)(this,"cargarTrabajadoresFichados",(()=>(0,c.emitSocket)("cargarTrabajadores"))),(0,o.Z)(this,"cargarCestas",(()=>(0,c.emitSocket)("cargarCestas"))),(0,o.Z)(this,"cargarVentas",(()=>(0,c.emitSocket)("cargarVentas"))),(0,o.Z)(this,"cargarTeclado",(()=>(0,c.emitSocket)("cargarTeclado")))}async todoInstalado(){try{return(await n.Z.get(d+"parametros/todoInstalado")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async hayFichados(){try{return(await n.Z.get(d+"trabajadores/hayFichados")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async cajaAbierta(){try{return(await n.Z.get(d+"caja/estadoCaja")).data}catch(e){return s().fire("Oops...",e.message,"error"),!1}}async getParametros(){try{return(await n.Z.post(d+"parametros/getParametros")).data}catch(e){return s().fire("Oops...",e.message,"error"),null}}async iniciarToc(){await this.todoInstalado()?await this.hayFichados()?await this.cajaAbierta()?i.Z.push("/main"):i.Z.push("/abrirCaja"):i.Z.push("/menu/fichajes"):i.Z.push("/installWizard")}}const l=new u},2781:function(e,t,a){a.d(t,{Z:function(){return b}});var o=a(65),n={namespaced:!0,state:{arrayTrabajadores:[],indexActivo:null},mutations:{setArrayTrabajadoresMutation(e,t){e.arrayTrabajadores=t},setIndexActivoMutation(e,t){e.indexActivo=t}},getters:{getArrayTrabajadores:e=>e.arrayTrabajadores,getIndexActivo:e=>e.trabajadorActivo,getTrabajadorActivo:e=>e.arrayTrabajadores[e.indexActivo]},actions:{setArrayTrabajadores({commit:e},t){e("setArrayTrabajadoresMutation",t)},setIndexActivo({commit:e},t){e("setIndexActivoMutation",t)}}},r=a(70),s=a(2492),i=a.n(s),c={namespaced:!0,state:{arrayCestas:[],indexItemActivo:null},mutations:{setArrayCestasMutation(e,t){e.arrayCestas=t},setActivoMutation(e,t){e.indexItemActivo=t},deleteIndexMutation(e,{index:t,idCesta:a}){r.Z.post("cestas/borrarItemCesta",{idCesta:a,index:t}).then((t=>{if(!t.data)throw Error("No se ha podido eliminar el artículo de la cesta");e.indexItemActivo=null})).catch((e=>{i().fire("Oops...",e.message,"error")}))},deleteListaMutation(e,t){r.Z.post("cestas/borrarCesta",{idCesta:t}).then((e=>{if(!e.data)throw Error("No se ha podido borrar la lista")})).catch((e=>{i().fire("Oops...",e.message,"error")}))},async setClienteMutation(e,{index:t,idCliente:a,nombreCliente:o}){e.arrayCestas[t].idCliente=a,e.arrayCestas[t].nombreCliente=o,await d(e.arrayCestas[t])},async setModoMutation(e,{modo:t,index:a}){e.arrayCestas[a].modo=t,await d(e.arrayCestas[a])}},getters:{getArrayCestas:e=>e.arrayCestas},actions:{setActivoAction({commit:e},t){e("setActivoMutation",t)},setArrayCestasAction({commit:e},t){e("setArrayCestasMutation",t)},deleteIndex({commit:e},{index:t,idCesta:a}){e("deleteIndexMutation",{index:t,idCesta:a})},deleteLista({commit:e},t){e("deleteListaMutation",t)},setClienteCesta({commit:e},t){e("setClienteMutation",t)},setModoCesta({commit:e},t){e("setModoMutation",t)}}};async function d(e){try{const t=await r.Z.post("cestas/updateCestaInverso",{cesta:e});if(!t.data)throw Error("No se ha podido actualizar la cesta en el servidor")}catch(t){i().fire("Oops...",t.message,"error")}}var u={namespaced:!0,state:{cajaAbierta:!1,arrayVentas:[]},mutations:{setArrayVentasMutation(e,t){e.arrayVentas=t}},getters:{},actions:{setArrayVentas({commit:e},t){e("setArrayVentasMutation",t)}}},l={namespaced:!0,state:{objTeclado:[],indexMenuActivo:0,indexSubmenuActivo:0},mutations:{setTecladoMutation(e,t){e.objTeclado=t},setIndexMenuActivoMutation(e,t){e.indexMenuActivo=t,e.indexSubmenuActivo=0},setIndexSubmenuActivoMutation(e,t){e.indexSubmenuActivo=t}},getters:{getTeclado:e=>e.objTeclado},actions:{setTeclado({commit:e},t){e("setTecladoMutation",t)},setIndexMenuActivo({commit:e},t){e("setIndexMenuActivoMutation",t)},setIndexSubmenuActivo({commit:e},t){e("setIndexSubmenuActivoMutation",t)}}},m={namespaced:!0,state:{suplementos:!0,mesas:!1},getters:{suplementosActivos:e=>e.suplementos,mesasActivas:e=>e.mesas},mutations:{setSuplementosMutation(e,t){e.suplementos=t},setMesasMutation(e,t){e.mesas=t}},actions:{setSuplemetos({commit:e},t){e("setSuplementosMutation",t)},setMesas({commit:e},t){e("setMesasMutation",t)}}},f={namespaced:!0,state:{estado:""},mutations:{setEstadoMutation(e,t){e.estado=t}},actions:{setEstado({commit:e},t){e("setEstadoMutation",t)}}},p={namespaced:!0,state:{vistaEspecial:!1},mutations:{setVistaClienteMutation(e,t){e.vistaEspecial=t},resetMutation(e){e.vistaEspecial=!1}},getters:{},actions:{setVistaCliente({commit:e},t){e("setVistaClienteMutation",t)},reset({commit:e}){e("resetMutation")}}},h={namespaced:!0,state:{unidades:1},mutations:{setUnidadesMutation(e,t){e.unidades=t}},getters:{getUnidades:e=>e.unidades},actions:{setUnidades({commit:e},t){e("setUnidadesMutation",t)}}},b=(0,o.MT)({state:{vistaEspecial:!1},getters:{},mutations:{},actions:{},modules:{Caja:u,Cestas:c,Trabajadores:n,Teclado:l,Configuracion:m,Datafono:f,EstadoDinamico:p,Unidades:h}})}},t={};function a(o){var n=t[o];if(void 0!==n)return n.exports;var r=t[o]={id:o,loaded:!1,exports:{}};return e[o].call(r.exports,r,r.exports,a),r.loaded=!0,r.exports}a.m=e,function(){var e=[];a.O=function(t,o,n,r){if(!o){var s=1/0;for(u=0;u<e.length;u++){o=e[u][0],n=e[u][1],r=e[u][2];for(var i=!0,c=0;c<o.length;c++)(!1&r||s>=r)&&Object.keys(a.O).every((function(e){return a.O[e](o[c])}))?o.splice(c--,1):(i=!1,r<s&&(s=r));if(i){e.splice(u--,1);var d=n();void 0!==d&&(t=d)}}return t}r=r||0;for(var u=e.length;u>0&&e[u-1][2]>r;u--)e[u]=e[u-1];e[u]=[o,n,r]}}(),function(){a.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return a.d(t,{a:t}),t}}(),function(){a.d=function(e,t){for(var o in t)a.o(t,o)&&!a.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}}(),function(){a.f={},a.e=function(e){return Promise.all(Object.keys(a.f).reduce((function(t,o){return a.f[o](e,t),t}),[]))}}(),function(){a.u=function(e){return"js/"+e+"."+{52:"9ab9ca09",134:"f218c968",226:"ba5c4138",313:"079971a5",472:"925f05f6",477:"d6395fee",496:"7207d362",506:"12f24a9b",780:"31f45003",820:"9e4b3145",836:"24580bf2",837:"e92851e2",879:"e202bd6d",893:"593a5c29",986:"b547f390",995:"7953d635"}[e]+".js"}}(),function(){a.miniCssF=function(e){return"css/"+e+"."+{134:"0e6b3395",226:"c6fbc710",472:"42f1f75c",477:"24eb6ad9",506:"2c14b51d",780:"bfd7c867",820:"4981e17e",837:"d5d08322",879:"ff4fb66a",893:"d6660cf7",986:"c7911e5c",995:"fbeefc35"}[e]+".css"}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){var e={},t="toc-game-v4:";a.l=function(o,n,r,s){if(e[o])e[o].push(n);else{var i,c;if(void 0!==r)for(var d=document.getElementsByTagName("script"),u=0;u<d.length;u++){var l=d[u];if(l.getAttribute("src")==o||l.getAttribute("data-webpack")==t+r){i=l;break}}i||(c=!0,i=document.createElement("script"),i.charset="utf-8",i.timeout=120,a.nc&&i.setAttribute("nonce",a.nc),i.setAttribute("data-webpack",t+r),i.src=o),e[o]=[n];var m=function(t,a){i.onerror=i.onload=null,clearTimeout(f);var n=e[o];if(delete e[o],i.parentNode&&i.parentNode.removeChild(i),n&&n.forEach((function(e){return e(a)})),t)return t(a)},f=setTimeout(m.bind(null,void 0,{type:"timeout",target:i}),12e4);i.onerror=m.bind(null,i.onerror),i.onload=m.bind(null,i.onload),c&&document.head.appendChild(i)}}}(),function(){a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){a.nmd=function(e){return e.paths=[],e.children||(e.children=[]),e}}(),function(){a.p="/"}(),function(){var e=function(e,t,a,o){var n=document.createElement("link");n.rel="stylesheet",n.type="text/css";var r=function(r){if(n.onerror=n.onload=null,"load"===r.type)a();else{var s=r&&("load"===r.type?"missing":r.type),i=r&&r.target&&r.target.href||t,c=new Error("Loading CSS chunk "+e+" failed.\n("+i+")");c.code="CSS_CHUNK_LOAD_FAILED",c.type=s,c.request=i,n.parentNode.removeChild(n),o(c)}};return n.onerror=n.onload=r,n.href=t,document.head.appendChild(n),n},t=function(e,t){for(var a=document.getElementsByTagName("link"),o=0;o<a.length;o++){var n=a[o],r=n.getAttribute("data-href")||n.getAttribute("href");if("stylesheet"===n.rel&&(r===e||r===t))return n}var s=document.getElementsByTagName("style");for(o=0;o<s.length;o++){n=s[o],r=n.getAttribute("data-href");if(r===e||r===t)return n}},o=function(o){return new Promise((function(n,r){var s=a.miniCssF(o),i=a.p+s;if(t(s,i))return n();e(o,i,n,r)}))},n={143:0};a.f.miniCss=function(e,t){var a={134:1,226:1,472:1,477:1,506:1,780:1,820:1,837:1,879:1,893:1,986:1,995:1};n[e]?t.push(n[e]):0!==n[e]&&a[e]&&t.push(n[e]=o(e).then((function(){n[e]=0}),(function(t){throw delete n[e],t})))}}(),function(){var e={143:0};a.f.j=function(t,o){var n=a.o(e,t)?e[t]:void 0;if(0!==n)if(n)o.push(n[2]);else{var r=new Promise((function(a,o){n=e[t]=[a,o]}));o.push(n[2]=r);var s=a.p+a.u(t),i=new Error,c=function(o){if(a.o(e,t)&&(n=e[t],0!==n&&(e[t]=void 0),n)){var r=o&&("load"===o.type?"missing":o.type),s=o&&o.target&&o.target.src;i.message="Loading chunk "+t+" failed.\n("+r+": "+s+")",i.name="ChunkLoadError",i.type=r,i.request=s,n[1](i)}};a.l(s,c,"chunk-"+t,t)}},a.O.j=function(t){return 0===e[t]};var t=function(t,o){var n,r,s=o[0],i=o[1],c=o[2],d=0;if(s.some((function(t){return 0!==e[t]}))){for(n in i)a.o(i,n)&&(a.m[n]=i[n]);if(c)var u=c(a)}for(t&&t(o);d<s.length;d++)r=s[d],a.o(e,r)&&e[r]&&e[r][0](),e[r]=0;return a.O(u)},o=self["webpackChunktoc_game_v4"]=self["webpackChunktoc_game_v4"]||[];o.forEach(t.bind(null,0)),o.push=t.bind(null,o.push.bind(o))}();var o=a.O(void 0,[998],(function(){return a(4171)}));o=a.O(o)})();
//# sourceMappingURL=app.047f84a0.js.map