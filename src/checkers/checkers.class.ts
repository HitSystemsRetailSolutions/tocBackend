import * as ping from "ping"

export class checkersClass {
  checkers() {}

  idx_hostToProbe=0 // para no probar siempre el mismo host, se usa este indice ciclico
  async internet_with_pings() {
    const hosts=['8.8.8.8', '1.1.1.1', '8.8.4.4', 'google.com'] // dns de google y cloudflare
    let rest_probes=hosts.length // número de pruebas máximas, una por cada host
    let alive=false
    let idx=this.idx_hostToProbe // variable local de idx_hostToProbe, por si se llama la función dos veces concurrentemente 
    while (rest_probes>0 && !alive) {
      try {
        let p = await ping.promise.probe(hosts[idx], {min_reply:1, timeout:5})
        alive = p.alive
      } catch(e) {
          // no se ha podido crear el proceso ping, (no existe el programa, el usuario no tiene permisos, etc), no tendria que pasar
      }
      idx = (idx+1)%hosts.length; // incrementar ciclicamente al siguiente host
      rest_probes--
    }
    this.idx_hostToProbe = idx // host a probar la proxima vez
    return alive
  }
    
}

const checkersInstance = new checkersClass();
export { checkersInstance };
