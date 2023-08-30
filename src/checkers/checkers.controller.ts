import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";

@Controller("checkers")
export class checkers {
  @Post("internet")
  async checkInternet() {
    try {
      return axios
        .get("https://www.google.es", { timeout: 5000 })
        .then(() => {
          return true;
        })
        .catch((e) => {
          return false;
        });
    } catch (err) {
      return false;
    }
  }
}
