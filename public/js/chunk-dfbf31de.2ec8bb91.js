(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-dfbf31de"],{"0cfc":function(t,e,r){t.exports=r.p+"img/uneuro.d4d09342.png"},"0e5e":function(t,e,r){t.exports=r.p+"img/img-tarjetas.6adf4bbd.png"},"100f":function(t,e,r){t.exports=r.p+"img/1cts.08f9a496.png"},1091:function(t,e,r){t.exports=r.p+"img/10euros.71677dd3.png"},1135:function(t,e,r){t.exports=r.p+"img/20euros.d0df58ee.png"},"1da1":function(t,e,r){"use strict";r.d(e,"a",(function(){return a}));r("d3b7");function n(t,e,r,n,a,o,c){try{var i=t[o](c),s=i.value}catch(l){return void r(l)}i.done?e(s):Promise.resolve(s).then(n,a)}function a(t){return function(){var e=this,r=arguments;return new Promise((function(a,o){var c=t.apply(e,r);function i(t){n(c,a,o,i,s,"next",t)}function s(t){n(c,a,o,i,s,"throw",t)}i(void 0)}))}}},2888:function(t,e,r){t.exports=r.p+"img/5euros.4a15401a.png"},"41ef":function(t,e,r){t.exports=r.p+"img/50euros.de313b3c.png"},"54ab":function(t,e,r){t.exports=r.p+"img/img-efectivo-disabled.aabb57ee.png"},"7cd7":function(t,e,r){t.exports=r.p+"img/img-cancelar-paytef.b82fe78e.png"},"96cf":function(t,e,r){var n=function(t){"use strict";var e,r=Object.prototype,n=r.hasOwnProperty,a="function"===typeof Symbol?Symbol:{},o=a.iterator||"@@iterator",c=a.asyncIterator||"@@asyncIterator",i=a.toStringTag||"@@toStringTag";function s(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{s({},"")}catch(P){s=function(t,e,r){return t[e]=r}}function l(t,e,r,n){var a=e&&e.prototype instanceof g?e:g,o=Object.create(a.prototype),c=new z(n||[]);return o._invoke=k(t,r,c),o}function u(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(P){return{type:"throw",arg:P}}}t.wrap=l;var d="suspendedStart",f="suspendedYield",b="executing",h="completed",p={};function g(){}function v(){}function m(){}var j={};s(j,o,(function(){return this}));var O=Object.getPrototypeOf,y=O&&O(O(L([])));y&&y!==r&&n.call(y,o)&&(j=y);var C=m.prototype=g.prototype=Object.create(j);function w(t){["next","throw","return"].forEach((function(e){s(t,e,(function(t){return this._invoke(e,t)}))}))}function x(t,e){function r(a,o,c,i){var s=u(t[a],t,o);if("throw"!==s.type){var l=s.arg,d=l.value;return d&&"object"===typeof d&&n.call(d,"__await")?e.resolve(d.__await).then((function(t){r("next",t,c,i)}),(function(t){r("throw",t,c,i)})):e.resolve(d).then((function(t){l.value=t,c(l)}),(function(t){return r("throw",t,c,i)}))}i(s.arg)}var a;function o(t,n){function o(){return new e((function(e,a){r(t,n,e,a)}))}return a=a?a.then(o,o):o()}this._invoke=o}function k(t,e,r){var n=d;return function(a,o){if(n===b)throw new Error("Generator is already running");if(n===h){if("throw"===a)throw o;return M()}r.method=a,r.arg=o;while(1){var c=r.delegate;if(c){var i=E(c,r);if(i){if(i===p)continue;return i}}if("next"===r.method)r.sent=r._sent=r.arg;else if("throw"===r.method){if(n===d)throw n=h,r.arg;r.dispatchException(r.arg)}else"return"===r.method&&r.abrupt("return",r.arg);n=b;var s=u(t,e,r);if("normal"===s.type){if(n=r.done?h:f,s.arg===p)continue;return{value:s.arg,done:r.done}}"throw"===s.type&&(n=h,r.method="throw",r.arg=s.arg)}}}function E(t,r){var n=t.iterator[r.method];if(n===e){if(r.delegate=null,"throw"===r.method){if(t.iterator["return"]&&(r.method="return",r.arg=e,E(t,r),"throw"===r.method))return p;r.method="throw",r.arg=new TypeError("The iterator does not provide a 'throw' method")}return p}var a=u(n,t.iterator,r.arg);if("throw"===a.type)return r.method="throw",r.arg=a.arg,r.delegate=null,p;var o=a.arg;return o?o.done?(r[t.resultName]=o.value,r.next=t.nextLoc,"return"!==r.method&&(r.method="next",r.arg=e),r.delegate=null,p):o:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,p)}function T(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function A(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function z(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(T,this),this.reset(!0)}function L(t){if(t){var r=t[o];if(r)return r.call(t);if("function"===typeof t.next)return t;if(!isNaN(t.length)){var a=-1,c=function r(){while(++a<t.length)if(n.call(t,a))return r.value=t[a],r.done=!1,r;return r.value=e,r.done=!0,r};return c.next=c}}return{next:M}}function M(){return{value:e,done:!0}}return v.prototype=m,s(C,"constructor",m),s(m,"constructor",v),v.displayName=s(m,i,"GeneratorFunction"),t.isGeneratorFunction=function(t){var e="function"===typeof t&&t.constructor;return!!e&&(e===v||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,m):(t.__proto__=m,s(t,i,"GeneratorFunction")),t.prototype=Object.create(C),t},t.awrap=function(t){return{__await:t}},w(x.prototype),s(x.prototype,c,(function(){return this})),t.AsyncIterator=x,t.async=function(e,r,n,a,o){void 0===o&&(o=Promise);var c=new x(l(e,r,n,a),o);return t.isGeneratorFunction(r)?c:c.next().then((function(t){return t.done?t.value:c.next()}))},w(C),s(C,i,"Generator"),s(C,o,(function(){return this})),s(C,"toString",(function(){return"[object Generator]"})),t.keys=function(t){var e=[];for(var r in t)e.push(r);return e.reverse(),function r(){while(e.length){var n=e.pop();if(n in t)return r.value=n,r.done=!1,r}return r.done=!0,r}},t.values=L,z.prototype={constructor:z,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=e,this.done=!1,this.delegate=null,this.method="next",this.arg=e,this.tryEntries.forEach(A),!t)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=e)},stop:function(){this.done=!0;var t=this.tryEntries[0],e=t.completion;if("throw"===e.type)throw e.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var r=this;function a(n,a){return i.type="throw",i.arg=t,r.next=n,a&&(r.method="next",r.arg=e),!!a}for(var o=this.tryEntries.length-1;o>=0;--o){var c=this.tryEntries[o],i=c.completion;if("root"===c.tryLoc)return a("end");if(c.tryLoc<=this.prev){var s=n.call(c,"catchLoc"),l=n.call(c,"finallyLoc");if(s&&l){if(this.prev<c.catchLoc)return a(c.catchLoc,!0);if(this.prev<c.finallyLoc)return a(c.finallyLoc)}else if(s){if(this.prev<c.catchLoc)return a(c.catchLoc,!0)}else{if(!l)throw new Error("try statement without catch or finally");if(this.prev<c.finallyLoc)return a(c.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var a=this.tryEntries[r];if(a.tryLoc<=this.prev&&n.call(a,"finallyLoc")&&this.prev<a.finallyLoc){var o=a;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=e&&e<=o.finallyLoc&&(o=null);var c=o?o.completion:{};return c.type=t,c.arg=e,o?(this.method="next",this.next=o.finallyLoc,p):this.complete(c)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),p},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),A(r),p}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var a=n.arg;A(r)}return a}}throw new Error("illegal catch attempt")},delegateYield:function(t,r,n){return this.delegate={iterator:L(t),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=e),p}},t}(t.exports);try{regeneratorRuntime=n}catch(a){"object"===typeof globalThis?globalThis.regeneratorRuntime=n:Function("r","regeneratorRuntime = r")(n)}},"9e6f":function(t,e,r){t.exports=r.p+"img/img-restaurant.96084bf3.png"},a340:function(t,e,r){t.exports=r.p+"img/doseuros.920ccd20.png"},a7d3:function(t,e,r){t.exports=r.p+"img/100euros.2f9cefba.png"},ad1d:function(t,e,r){},b9b8:function(t,e,r){t.exports=r.p+"img/10cts.aecf0c2d.png"},bb12:function(t,e,r){"use strict";r("ad1d")},c05b:function(t,e,r){t.exports=r.p+"img/500euros.db40467f.png"},cc03:function(t,e,r){t.exports=r.p+"img/5cts.1ad0ba13.png"},cff6:function(t,e,r){t.exports=r.p+"img/200euros.594db7de.png"},d68e:function(t,e,r){t.exports=r.p+"img/50cts.a9507b29.png"},d69f:function(t,e,r){t.exports=r.p+"img/img-efectivo.0a3202b8.png"},ea88:function(t,e,r){t.exports=r.p+"img/img-tarjetas-disabled.b2f9a319.png"},edb7:function(t,e,r){t.exports=r.p+"img/20cts.f25065eb.png"},fbdc:function(t,e,r){"use strict";r.r(e);var n=r("7a23");function a(t,e,r,a,o,c){var i=Object(n["F"])("CobroComponent");return Object(n["x"])(),Object(n["e"])(i)}r("b680"),r("a9e3");var o=r("100f"),c=r.n(o),i=r("fbdd"),s=r.n(i),l=r("cc03"),u=r.n(l),d=r("b9b8"),f=r.n(d),b=r("edb7"),h=r.n(b),p=r("d68e"),g=r.n(p),v=r("0cfc"),m=r.n(v),j=r("a340"),O=r.n(j),y=r("2888"),C=r.n(y),w=r("1091"),x=r.n(w),k=r("1135"),E=r.n(k),T=r("41ef"),A=r.n(T),z=r("a7d3"),L=r.n(z),M=r("cff6"),P=r.n(M),I=r("c05b"),N=r.n(I),F=r("d69f"),R=r.n(F),_=r("54ab"),B=r.n(_),D=r("0e5e"),S=r.n(D),V=r("ea88"),G=r.n(V),J=r("9e6f"),K=r.n(J),Y=r("7cd7"),H=r.n(Y),U=function(t){return Object(n["A"])("data-v-f1722a68"),t=t(),Object(n["y"])(),t},X={class:"container-fluid mt-2"},q={class:"row"},Q={class:"col-md-12 text-center"},W=["width"],Z=["width"],$=["width"],tt=["width"],et=["width"],rt=["width"],nt=["width"],at=["width"],ot={class:"row"},ct={class:"col-md-12 text-center"},it=["width"],st=["width"],lt=["width"],ut=["width"],dt=["width"],ft=["width"],bt=["width"],ht={class:"row"},pt={class:"col-md-7"},gt={class:"row"},vt={class:"col",style:{"max-width":"325px"}},mt={class:"btn-group-vertical",role:"group"},jt={class:"btn-group"},Ot={class:"btn-group"},yt={class:"btn-group"},Ct={class:"btn-group"},wt={class:"col-md-6 pt-2 text-start colorTexto"},xt={style:{"font-size":"32px"},class:"fw-bold"},kt=U((function(){return Object(n["h"])("br",null,null,-1)})),Et={style:{"font-size":"32px"},class:"fw-bold"},Tt=U((function(){return Object(n["h"])("br",null,null,-1)})),At={style:{"font-size":"32px"},class:"fw-bold"},zt=U((function(){return Object(n["h"])("br",null,null,-1)})),Lt={key:0,class:"fw-bold",style:{"font-size":"32px",color:"red"}},Mt={key:1,class:"fw-bold",style:{"font-size":"32px",color:"green"}},Pt={class:"col-md-5"},It={key:0,class:"row"},Nt={class:"col-md-6 text-center"},Ft={class:"col-md-6 text-center"},Rt={class:"row mt-2"},_t=U((function(){return Object(n["h"])("div",{class:"col text-center"},[Object(n["h"])("img",{"data-bs-toggle":"modal","data-bs-target":"#exampleModal",src:K.a,alt:"tkrs",width:"185"})],-1)})),Bt={key:0,class:"col text-center"},Dt=U((function(){return Object(n["h"])("div",{class:"spinner-border mx-auto",style:{width:"5rem",height:"5rem"},role:"status"},[Object(n["h"])("span",{class:"visually-hidden"},"Loading...")],-1)})),St=[Dt],Vt={class:"position-absolute bottom-0 start-0 mb-2",style:{position:"absolute"}},Gt={class:"row ms-2",role:"group","aria-label":"First group"},Jt={class:"col"},Kt={class:"position-absolute bottom-0 end-0 mb-2 me-2"},Yt={class:"col-md-12 text-center"},Ht={class:"modal fade",id:"exampleModal",tabindex:"-1","aria-labelledby":"exampleModalLabel","aria-hidden":"true"},Ut={class:"modal-dialog"},Xt={class:"modal-content"},qt=U((function(){return Object(n["h"])("div",{class:"modal-header"},[Object(n["h"])("h5",{class:"modal-title",id:"exampleModalLabel"},"Importe del ticket restaurant"),Object(n["h"])("button",{type:"button",class:"btn-close","data-bs-dismiss":"modal","aria-label":"Close"})],-1)})),Qt={class:"modal-body"},Wt={class:"input-group mb-3"},Zt=U((function(){return Object(n["h"])("span",{class:"input-group-text"},"Cantidad",-1)})),$t={class:"modal-footer"},te=U((function(){return Object(n["h"])("button",{type:"button",class:"btn btn-secondary btn-lg","data-bs-dismiss":"modal"},"Cerrar",-1)}));function ee(t,e,r,a,o,i){return Object(n["x"])(),Object(n["g"])(n["a"],null,[Object(n["h"])("div",X,[Object(n["h"])("div",q,[Object(n["h"])("div",Q,[Object(n["h"])("img",{onClick:e[0]||(e[0]=function(t){return a.agregar(.01)}),src:c.a,alt:"Moneda 1 cts.",width:a.sizeMonedas},null,8,W),Object(n["h"])("img",{onClick:e[1]||(e[1]=function(t){return a.agregar(.02)}),src:s.a,alt:"Moneda 2 cts.",width:a.sizeMonedas,class:"mr-2"},null,8,Z),Object(n["h"])("img",{onClick:e[2]||(e[2]=function(t){return a.agregar(.05)}),src:u.a,alt:"Moneda 5 cts.",width:a.sizeMonedas,class:"mr-2"},null,8,$),Object(n["h"])("img",{onClick:e[3]||(e[3]=function(t){return a.agregar(.1)}),src:f.a,alt:"Moneda 10 cts.",width:a.sizeMonedas,class:"mr-2"},null,8,tt),Object(n["h"])("img",{onClick:e[4]||(e[4]=function(t){return a.agregar(.2)}),src:h.a,alt:"Moneda 20 cts.",width:a.sizeMonedas,class:"mr-2"},null,8,et),Object(n["h"])("img",{onClick:e[5]||(e[5]=function(t){return a.agregar(.5)}),src:g.a,alt:"Moneda 50 cts.",width:a.sizeMonedas,class:"mr-2"},null,8,rt),Object(n["h"])("img",{onClick:e[6]||(e[6]=function(t){return a.agregar(1)}),src:m.a,alt:"Moneda 1 euro",width:a.sizeMonedas,class:"mr-2"},null,8,nt),Object(n["h"])("img",{onClick:e[7]||(e[7]=function(t){return a.agregar(2)}),src:O.a,alt:"Moneda 2 euros",width:a.sizeMonedas,class:"mr-2"},null,8,at)])]),Object(n["h"])("div",ot,[Object(n["h"])("div",ct,[Object(n["h"])("img",{onClick:e[8]||(e[8]=function(t){return a.agregar(5)}),src:C.a,alt:"Billete 5 euros",width:a.sizeBilletes},null,8,it),Object(n["h"])("img",{onClick:e[9]||(e[9]=function(t){return a.agregar(10)}),src:x.a,alt:"Billete 10 euros",width:a.sizeBilletes,class:"p-2"},null,8,st),Object(n["h"])("img",{onClick:e[10]||(e[10]=function(t){return a.agregar(20)}),src:E.a,alt:"Billete 20 euros",width:a.sizeBilletes,class:"p-2"},null,8,lt),Object(n["h"])("img",{onClick:e[11]||(e[11]=function(t){return a.agregar(50)}),src:A.a,alt:"Billete 50 euros",width:a.sizeBilletes,class:"p-2"},null,8,ut),Object(n["h"])("img",{onClick:e[12]||(e[12]=function(t){return a.agregar(100)}),src:L.a,alt:"Billete 100 euros",width:a.sizeBilletes,class:"p-2"},null,8,dt),Object(n["h"])("img",{onClick:e[13]||(e[13]=function(t){return a.agregar(200)}),src:P.a,alt:"Billete 200 euros",width:a.sizeBilletes,class:"p-2"},null,8,ft),Object(n["h"])("img",{onClick:e[14]||(e[14]=function(t){return a.agregar(500)}),src:N.a,alt:"Billete 500 euros",width:a.sizeBilletes,class:"p-2"},null,8,bt)])]),Object(n["h"])("div",ht,[Object(n["h"])("div",pt,[Object(n["h"])("div",gt,[Object(n["h"])("div",vt,[Object(n["h"])("div",mt,[Object(n["h"])("div",jt,[Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[15]||(e[15]=function(t){return a.agregarTecla("7")})},"7"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[16]||(e[16]=function(t){return a.agregarTecla("8")})},"8"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[17]||(e[17]=function(t){return a.agregarTecla("9")})},"9")]),Object(n["h"])("div",Ot,[Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[18]||(e[18]=function(t){return a.agregarTecla("4")})},"4"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[19]||(e[19]=function(t){return a.agregarTecla("5")})},"5"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[20]||(e[20]=function(t){return a.agregarTecla("6")})},"6")]),Object(n["h"])("div",yt,[Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[21]||(e[21]=function(t){return a.agregarTecla("1")})},"1"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[22]||(e[22]=function(t){return a.agregarTecla("2")})},"2"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[23]||(e[23]=function(t){return a.agregarTecla("3")})},"3")]),Object(n["h"])("div",Ct,[Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[24]||(e[24]=function(t){return a.borrarCuentas()})},"C"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[25]||(e[25]=function(t){return a.agregarTecla("0")})},"0"),Object(n["h"])("a",{class:"botonEze botonesCalculadora",onClick:e[26]||(e[26]=function(t){return a.agregarComa()})},",")])])]),Object(n["h"])("div",wt,[Object(n["h"])("span",xt," Total: "+Object(n["I"])(Number(a.total).toFixed(2))+" € ",1),kt,Object(n["h"])("span",Et," Dinero recibido: "+Object(n["I"])(a.cuenta+a.totalTkrs)+" € ",1),Tt,Object(n["h"])("span",At," Ticket Restaurant: "+Object(n["I"])(a.totalTkrs)+" € ",1),zt,a.faltaOSobra?(Object(n["x"])(),Object(n["g"])("span",Lt," Faltan: "+Object(n["I"])(a.total-(a.totalTkrs+a.cuenta))+" € ",1)):(Object(n["x"])(),Object(n["g"])("span",Mt," Sobran: "+Object(n["I"])(a.sobranX.toFixed(2))+" € ",1))])])]),Object(n["h"])("div",Pt,[!1===a.esVIP&&!1===a.esDevolucion&&!1===a.esConsumoPersonal&&a.botonesCobroActivo&&!1===a.tkrs?(Object(n["x"])(),Object(n["g"])("div",It,[Object(n["h"])("div",Nt,["EFECTIVO"==a.metodoPagoActivo?(Object(n["x"])(),Object(n["g"])("img",{key:0,onClick:e[27]||(e[27]=function(t){return a.setMetodoPago("EFECTIVO")}),src:R.a,alt:"Cobrar con efectivo",width:"185"})):(Object(n["x"])(),Object(n["g"])("img",{key:1,onClick:e[28]||(e[28]=function(t){return a.setMetodoPago("EFECTIVO")}),src:B.a,alt:"Cobrar con efectivo",width:"185"}))]),Object(n["h"])("div",Ft,["TARJETA"==a.metodoPagoActivo?(Object(n["x"])(),Object(n["g"])("img",{key:0,onClick:e[29]||(e[29]=function(t){return a.setMetodoPago("TARJETA")}),src:S.a,alt:"Cobrar con tarjeta",width:"185"})):(Object(n["x"])(),Object(n["g"])("img",{key:1,onClick:e[30]||(e[30]=function(t){return a.setMetodoPago("TARJETA")}),src:G.a,alt:"Cobrar con tarjeta",width:"185"}))])])):Object(n["f"])("",!0),Object(n["h"])("div",Rt,[_t,"PAYTEF"==a.tipoDatafono?(Object(n["x"])(),Object(n["g"])("div",Bt,[Object(n["h"])("img",{onClick:e[31]||(e[31]=function(t){return a.cancelarOperacionDatafono()}),src:H.a,alt:"tkrs",width:"185"})])):Object(n["f"])("",!0)]),Object(n["h"])("div",{class:Object(n["r"])(["row mt-2",{datafonoEsperando:!a.esperando}])},St,2)])])]),Object(n["h"])("div",Vt,[Object(n["h"])("div",Gt,[Object(n["h"])("div",Jt,[Object(n["h"])("button",{type:"button",onClick:e[32]||(e[32]=function(t){return a.volver()}),class:"btn btn-warning ms-4 botonesPrincipales"},"Volver")])])]),Object(n["h"])("div",Kt,[Object(n["h"])("div",Yt,[Object(n["h"])("button",{onClick:e[33]||(e[33]=function(t){return a.cobrar()}),class:"btn btn-secondary w-100 totalStyle botonCobrar menusColorIvan"}," Cobrar "+Object(n["I"])(a.cobrarVariable)+" € ",1)])]),Object(n["h"])("div",Ht,[Object(n["h"])("div",Ut,[Object(n["h"])("div",Xt,[qt,Object(n["h"])("div",Qt,[Object(n["h"])("div",Wt,[Zt,Object(n["R"])(Object(n["h"])("input",{type:"number","onUpdate:modelValue":e[34]||(e[34]=function(t){return a.totalTkrs=t}),class:"form-control",style:{"font-size":"45px"}},null,512),[[n["N"],a.totalTkrs]])])]),Object(n["h"])("div",$t,[te,Object(n["h"])("button",{type:"button",class:"btn btn-primary btn-lg","data-bs-dismiss":"modal",onClick:e[35]||(e[35]=function(t){return a.configurarCantidad()})},"Aceptar")])])])])],64)}var re=r("1da1"),ne=(r("96cf"),r("ac1f"),r("5319"),r("bc3a")),ae=r.n(ne),oe=r("5502"),ce=r("6c02"),ie=r("0180"),se=r("a18c"),le=r("799c"),ue={name:"CobroComponent",setup:function(){var t=Object(ie["b"])(),e=(Object(ce["c"])(),Object(oe["b"])()),r=Object(n["C"])(0),a=(e.getters["getModoActual"],e.getters["Clientes/getInfoCliente"]),o="100",c="150",i=!1,s=!1,l=!1,u=!0,d=Object(n["C"])(!1),f=Object(n["C"])(0),b=Object(n["C"])(0),h=Object(n["C"])("TARJETA"),p=Object(n["C"])(0),g=Object(n["C"])(0),v=e.getters["Cesta/getCestaId"],m=Object(n["C"])([]),j=Object(n["C"])(null),O=Object(n["c"])((function(){return e.state.esperandoDatafono}));function y(){return ae.a.post("cestas/getCestaCurrent",{idCesta:v}).then((function(e){return e.data.error?(t.error(e.data.mensaje),-1):e.data.info._id}))["catch"]((function(e){return t.error(e.message),-1}))}function C(){f.value=0,b.value=0,p.value=0,g.value=0}function w(t){b.value=String(Number(b.value+t))}function x(){ae.a.get("paytef/cancelarOperacionActual").then((function(e){e.data||t.error("Error, no se ha podido cancelar la operación en curso")}))["catch"]((function(e){console.log(e),t.error("Error catch cancelar operación")}))}function k(){O.value?t.info("Hay una operación pendiente, debes cancelarla antes de salir."):se["a"].push("/")}function E(){d.value?p.value="".concat(p.value.replace(".",""),"."):b.value="".concat(b.value.replace(".",""),".")}function T(t){p.value=t}function A(){var e=Number(p.value);e>0?T(e):t.error("Importe ticket restaurant incorrecto")}function z(t){f.value+=t}function L(){d.value?(d.value=!1,h.value="EFECTIVO"):(h.value="TICKET_RESTAURANT",d.value=!0)}function M(){p.value=0,f.value=0,b.value=0}function P(t){h.value=t}ae.a.post("cestas/getCestaCurrent",{idCesta:v}).then((function(e){!1===e.data.error?r.value=e.data.info.tiposIva.importe1+e.data.info.tiposIva.importe2+e.data.info.tiposIva.importe3:(r.value=0,t.error(e.data.error))}))["catch"]((function(e){console.log(e),t.error("No se ha podido cargar la cesta")}));var I=Object(n["c"])((function(){return r.value-p.value<=0?0:(r.value-p.value).toFixed(2).replace(".",",")})),N=Object(n["c"])((function(){return d.value?r.value-p.value?(u=!0,g.value+p.value+r.value):(u=!1,g.value):g.value+p.value-r.value})),F=Object(n["c"])((function(){return g.value+p.value-r.value<0})),R=Object(n["P"])((function(){g.value=f.value})),_=Object(n["P"])((function(){g.value=Number(b.value)}));function B(t){e.dispatch("setEsperandoDatafono",t)}function D(){return S.apply(this,arguments)}function S(){return S=Object(re["a"])(regeneratorRuntime.mark((function e(){var n,o;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:if(O.value){e.next=18;break}return e.next=3,y();case 3:if(n=e.sent,e.t0=p.value>0,!e.t0){e.next=11;break}return e.next=8,n;case 8:e.t1=e.sent,e.t2=-1,e.t0=e.t1!=e.t2;case 11:if(!e.t0){e.next=15;break}r.value>0?(o={total:Number(r.value),totalTkrs:p.value,idCesta:n,idCliente:a},ae.a.post("tickets/crearTicketTKRS",o).then((function(e){if(e.data.error)t.error("Error al insertar el ticket.");else{C();try{ae.a.post("impresora/abrirCajon")}catch(r){t.error("No se ha podido abrir el cajón.")}t.success("Ticket OK"),se["a"].push("/")}}))["catch"]((function(e){console.log(e),t.error("Error")}))):t.warning("No puedes cerrar una venta de 0€ con ticket restaurante"),e.next=18;break;case 15:"EFECTIVO"===h.value&&ae.a.post("tickets/crearTicketEfectivo",{total:Number(r.value),idCesta:n,idCliente:a}).then((function(e){if(e.data.error)t.error(e.data.mensaje);else{C();try{ae.a.post("impresora/abrirCajon")}catch(r){t.error("No se ha podido abrir el cajón")}t.success("Ticket OK"),se["a"].push("/")}}))["catch"]((function(e){console.log(e),t.error(e.message)})),"TARJETA 3G"===h.value&&(r.value>0?ae.a.post("tickets/crearTicketDatafono3G",{total:Number(r),idCesta:n,idCliente:a}).then((function(e){e.data.error?t.error("Error al insertar el ticket"):(C(),se["a"].push({name:"Home",params:{tipoToast:"success",mensajeToast:"Ticket creado"}}))}))["catch"]((function(e){console.log(e),t.error("Error")})):t.warning("No puedes cerrar una venta de 0€ con datáfono")),"TARJETA"===h.value&&(r.value>0?"CLEARONE"==j.value?(Object(le["a"])("enviarAlDatafono",{total:Number(r),idCesta:n,idClienteFinal:a}),B(!0)):"PAYTEF"==j.value&&(B(!0),Object(le["a"])("iniciarTransaccion",{idClienteFinal:a,idCesta:v})):t.warning("No puedes cerrar una venta de 0€ con datáfono"));case 18:case"end":return e.stop()}}),e)}))),S.apply(this,arguments)}function C(){return V.apply(this,arguments)}function V(){return V=Object(re["a"])(regeneratorRuntime.mark((function r(){var n;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return r.next=2,ae.a.post("trabajadores/getCurrentTrabajador",{});case 2:n=r.sent,n.data.error&&t.error(n.data.mensaje),e.dispatch("setModoActual","NORMAL"),e.dispatch("Clientes/resetClienteActivo"),e.dispatch("Footer/resetMenuActivo"),ae.a.post("promociones/setEstadoPromociones",{estadoPromociones:!0});case 8:case"end":return r.stop()}}),r)}))),V.apply(this,arguments)}function G(){ae.a.post("cestas/enviarACocina",{idCesta:cestaID.value}).then((function(e){e.error?t.error("Error al enviar el pedido a cocina."):(t.success("OK."),k())}))}function J(){console.log("test vacío")}return Object(n["v"])((function(){ae.a.post("parametros/getParametros").then((function(t){j.value=t.data.parametros.tipoDatafono}))["catch"]((function(e){console.log(e),t.error("Error inicialización cobroMenu")})),ae.a.post("/trabajadores/getTrabajadoresFichados").then((function(e){e.data.error?t.error(e.data.mensaje):0===e.data.res.length&&t.error("No hay trabajadores fichados")}))["catch"]((function(t){console.log(t)}))})),{test:J,total:r,sizeBilletes:c,sizeMonedas:o,esVIP:i,esDevolucion:s,esConsumoPersonal:l,botonesCobroActivo:u,tkrs:d,agregarTecla:w,agregarComa:E,agregar:z,cobrarVariable:I,sobranX:N,faltaOSobra:F,cuentaAsistente:R,cuentaAsistenteTeclado:_,cuenta:g,totalTkrs:p,borrarCuentas:M,setMetodoPago:P,metodoPagoActivo:h,alternarTkrs:L,configurarCantidad:A,reset:C,arrayFichados:m,volver:k,cobrar:D,esperando:O,enviarACocina:G,cancelarOperacionDatafono:x,tipoDatafono:j}}},de=(r("bb12"),r("d959")),fe=r.n(de);const be=fe()(ue,[["render",ee],["__scopeId","data-v-f1722a68"]]);var he=be,pe={name:"Cobro",components:{CobroComponent:he}};const ge=fe()(pe,[["render",a]]);e["default"]=ge},fbdd:function(t,e,r){t.exports=r.p+"img/2cts.b4040beb.png"}}]);
//# sourceMappingURL=chunk-dfbf31de.2ec8bb91.js.map