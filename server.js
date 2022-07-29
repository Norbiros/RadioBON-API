import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";

import postgresql from 'pg';


const api = express();

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

api.use(cors());
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

// Post API to add new broadcasts
api.post("/broadcast", async (req, response) => {
  client.query(`insert into auditions (title, description) values ('${req.body.title}', '${req.body.description}');`, (err, res) => {
    if (err) {
      response.status(500).send({message: "Database error!"});
      return;
    }
    response.status(200).send({message: "Succesfully added data to database!"});
  });
});
