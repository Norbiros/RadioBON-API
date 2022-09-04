import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
const { createHash, randomBytes } = await import('node:crypto');
import postgresql from 'pg';

import {fetchKalibiData, fetchLibrusData, checkCredentials, isLoggedIn} from './utils.js';

const api = express();
const kalibiData = await fetchKalibiData();
kalibiData.forEach(function(e) {
  e.forEach(function(el) {
    //console.log(el.description);
  })
})

const PORT = process.env.PORT || 8000;
api.listen(PORT);
const { Client } = postgresql;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
client.connect();
console.log("RadioBON API started on port " + PORT + "!");

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
api.use(cors(corsOptions));
api.use(cookieParser());
api.use(bodyParser.urlencoded({ extended: false })) 
api.use(bodyParser.json())

api.get("/", async (req, res) => {
  res.send("RadioBON API!");
});

// Get API to show broadcasts
api.get("/broadcasts", async (req, response) => {
  client.query('select * from auditions;', (err, res) => {
    if (err) {
      response.status(500).send(err);
      return;
    }
    response.set('Content-Type', 'application/json');
    response.status(200).json(res.rows);
   });
});

api.post("/auth/login", async (req, response) => {
  let verified = await checkCredentials(req, client);
  if (!!req.cookies.sessionId) {
    response.status(400).send("Jesteś już zalogowany/a!");
    return;
  }
  if (verified === true) {
    let sessionId = randomBytes(16).toString("hex");
    response.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; SameSite=Lax`);
    response.status(200).send("Pomyślnie zalogowano!");
    client.query(`insert into sessions (username, sessionId) values ('${req.body.username}', '${sessionId}'); select * from sessions;`, (err, res) => {
      console.log(res.rows);
      console.log(err);
    });
  } else {
    response.status(401).send("Nie poprawne dane logowania!");
  }
});

/*
api.post("/register", async (req, response) => {
  let hashedPassword = createHash('sha256').update(req.body.password).digest('hex');
  client.query(`insert into passwords (username, password) values ('${req.body.username}' , '${hashedPassword}'); select * from passwords;`, (err, res) => {
    if (err) {
      response.status(500).send("Niestety natrafiono na problem z bazą danych!");
      return;
    }
    response.status(200).send("Pomyślnie zarejestrowano użytkownika!");
  });
});
*/

// Post API to add new broadcasts
api.post("/broadcast", async (req, response) => {
  if ((await isLoggedIn(req, client)) !== true) {
    response.status(401).send("Nie zalogowano!");
    return;
  }

  client.query(`insert into auditions (title, description) values ('${req.body.title}', '${req.body.description}');`, (err, res) => {
    if (err) {
      console.log(err);
      response.status(500).send("Niestety natrafiono na problem z bazą danych!");
      return;
    }
    response.status(200).send("Pomyślnie dodano audycję!");
  });
});

api.get("/isLoggedIn", async (req, response) => {
  client.query('select * from sessions;', (err, res) => {
    let specificRow = res.rows.find(e => e.sessionid === req.cookies.sessionId);
    response.send(!!specificRow);
  });
});