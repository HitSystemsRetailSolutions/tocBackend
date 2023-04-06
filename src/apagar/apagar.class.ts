const exec = require("child_process").exec;
const os = require("os");
export class Apagar {
  apagarEquipo() {
    if (os.platform() === "linux") {
      exec("sudo -s shutdown now");
      return true;
    } else {
      exec("shutdown /p");
      return true;
    }
  }
}

export const apagarinstance = new Apagar();
