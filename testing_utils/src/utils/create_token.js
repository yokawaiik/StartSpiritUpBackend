"use strict";

import { initializeApp } from "firebase/app";
import * as firebaseAuth from "firebase/auth";

import { firebaseConfig } from "../config.js";

export const createToken = async (email, password) => {
  try {
    const app = initializeApp(firebaseConfig);

    const auth = firebaseAuth.getAuth(app);
    console.log(`email: ${email}`);
    console.log(`password: ${password}`);

    const credenitals = await firebaseAuth.signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token = await credenitals.user.getIdToken();

    return token;
  } catch (error) {
    console.log(error);
    return null;
  }
};
