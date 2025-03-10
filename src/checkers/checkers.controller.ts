import { Body, Controller, Post, Get } from "@nestjs/common";
import { checkersInstance } from "./checkers.class"
import axios from "axios";

@Controller("checkers")
export class CheckersController {
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
  @Post("internet_with_pings")
  async internet_with_pings() {
    return await checkersInstance.internet_with_pings()
  }
}
