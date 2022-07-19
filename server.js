import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
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
api.use(bodyParser.urlencoded({ extended: false })) 
api.use(bodyParser.json())


api.get("/", async (req, res) => {
  res.send("RadioBON API!");
});

// Get API to show broadcasts
api.get("/broadcasts", async (req, res) => {
  const dbRef = ref(getDatabase());
  const data = await get(child(dbRef, `broadcasts/`));
  if (data.exists()) {
    res.json( data.val() );
  } else {
    res.send( "No data available!" );
  }
});

// Post API to add new broadcasts
api.post("/broadcast", async (req, res) => {
  const dbRef = ref(getDatabase());
  const data = await get(child(dbRef, `broadcasts/`));
  let index  = data.val()?.length;
  if (!!req.body.title && !!req.body.description) {
    index = index ? index : 0;
    set(ref(database, ('broadcasts/' + index)), {
      Title: req.body.title,
      Description: req.body.description
    });
    res.status(200).send({message: "Succesfully added data to database!"});
  } else {
    res.status(500).send({message: "You didn't provide broadcasts title/description OR there is database error!"});
  }
});

// Get API to show broadcasts
api.get("/broadcasts", async (req, res) => {
  const dbRef = ref(getDatabase());
  const data = await get(child(dbRef, `ideas/`));
  if (data.exists()) {
    res.json( data.val() );
  } else {
    res.send( "No data available!" );
  }
});

// Post API to add new broadcasts
api.post("/new-idea", async (req, res) => {
  const dbRef = ref(getDatabase());
  const data = await get(child(dbRef, `ideas/`));
  let index  = data.val()?.length;
  if (!!req.body.title && !!req.body.description  && !!req.body.category  && !!req.body.date) {
    index = index ? index : 0;
    set(ref(database, ('ideas/' + index)), {
      Title: req.body.title,
      Description: req.body.description,
      Category: req.body.category,
      Date: req.body.date
    });
    res.status(200).send({message: "Succesfully added data to database!"});
  } else {
    res.status(500).send({message: "You didn't provide broadcasts title/description/category/date there is database error!"});
  }
});
