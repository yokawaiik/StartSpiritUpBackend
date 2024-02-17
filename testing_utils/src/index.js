"use strict";

import dotenv from "dotenv";
dotenv.config();

import { createToken } from "./utils/create_token.js";
import { saveTokenIntoFile } from "./utils/save_token_into_file.js";

const main = async function () {
  try {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (email === undefined || password === undefined) {
      throw "EMAIL or PASSWORD not found.";
    }
    const token = await createToken(email, password);
    console.log(`Authorization: ${token}`);
    await saveTokenIntoFile(token, "token.txt");
  } catch (error) {
    console.log("Error script.");
    console.log(`Error: ${error}`);
  }
};

main();
