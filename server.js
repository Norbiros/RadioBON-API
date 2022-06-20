import express from "express";
import cors from 'cors';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, child, get, set } from "firebase/database";

const api = express();

const firebaseConfig = {
  apiKey: `${process.env.FIREBASE_API_KEY}`,
  authDomain: `${process.env.FIREBASE_AUTH_DOMAIN}`,
  projectId: "radiobon-api",
  storageBucket: "radiobon-api.appspot.com",
  messagingSenderId: "638355162966",
  appId: "1:638355162966:web:55a7165220993aa14378f7",
  measurementId: "G-S5XNPKMYTZ",
  databaseURL: `${process.env.FIREBASE_DATABASE_DOMAIN}`
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const PORT = process.env.PORT || 8000;
api.listen(PORT);

console.log("RadioBON API started on port " + PORT + "!");

api.use(cors());

api.get("/", async (req, res) => {
  res.send("RadioBON API!");
});

api.get("/broadcasts", async (req, res) => {
  const dbRef = ref(getDatabase());
  const data = await get(child(dbRef, `broadcasts/`));
  if (data.exists()) {
    res.json( data.val() );
  } else {
    res.send( "No data available!" );
  }
});
