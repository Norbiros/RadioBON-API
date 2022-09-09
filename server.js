import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
const { randomBytes, createHash } = await import("node:crypto");
import { createClient } from "@supabase/supabase-js";

import {
  fetchKalibiData,
  fetchLibrusData,
  checkCredentials,
  isLoggedIn,
  checkForPermission,
  getUsernameFromCookies,
} from "./utils.js";

const api = express();
/*
const kalibiData = await fetchKalibiData();
kalibiData.forEach(function (e) {
  e.forEach(function (el) {
    //console.log(el.description);
  });
});
*/
export const supabase = createClient(
  "https://plxghautgvsgtichsmkr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseGdoYXV0Z3ZzZ3RpY2hzbWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjIyODQyMTQsImV4cCI6MTk3Nzg2MDIxNH0.KX0mM9SUiEjKQHn4d2HXjc5t-8p1sA9tpUd_hv79jIU"
);

const PORT = process.env.PORT || 8000;
api.listen(PORT);

console.log("RadioBON API started on port " + PORT + "!");

const corsOptions = {
  origin: process.env.WEBSITE_URL,
  credentials: true,
};
api.use(cors(corsOptions));
api.use(cookieParser());
api.use(bodyParser.urlencoded({ extended: false }));
api.use(bodyParser.json());

api.get("/", async (req, res) => {
  res.send("RadioBON API!");
});

// Get API to show broadcasts
api.get("/broadcasts", async (req, response) => {
  const { data, error } = await supabase.from("auditions").select();
  if (error) {
    response
      .status(500)
      .send("Natrafiono na niespodziewany błąd z bazą danych!");
    console.error(error);
    return;
  }
  response.set("Content-Type", "application/json");
  response.status(200).json(data);
});

api.post("/auth/login", async (req, response) => {
  let verified = await checkCredentials(req);
  if (verified === true) {
    let sessionId = randomBytes(16).toString("hex");

    const { data, error } = await supabase
      .from("sessions")
      .insert([{ username: req.body.username, session_id: sessionId }]);

    if (error) {
      response
        .status(500)
        .send("Niestety natrafiono na problem z bazą danych!");
      console.error(error);
    } else {
      response.setHeader(
        "Set-Cookie",
        `sessionId=${sessionId}; Path=/; SameSite=None; Secure;`
      );
      response.status(200).send("Pomyślnie zalogowano!");
    }
  } else {
    response.status(401).send("Nie poprawne dane logowania!");
  }
});

api.post("/register", async (req, response) => {
  if (!(await checkForPermission(await getUsernameFromCookies(req), "root"))) {
    response.status(401).send("Nie masz uprawnień!");
    return;
  }
  let hashedPassword = createHash("sha256")
    .update(req.body.password)
    .digest("hex");

  const { data, error } = await supabase.from("users").insert([
    {
      username: req.body.username,
      password: hashedPassword,
      permission: req.body.permission,
    },
  ]);

  if (error) {
    response.status(500).send("Niestety natrafiono na problem z bazą danych!");
    console.error(error);
  } else {
    response.status(200).send("Pomyślnie zarejestrowano użytkownika!");
  }
});

// Post API to add new broadcasts
api.post("/broadcast", async (req, response) => {
  if ((await isLoggedIn(req)) !== true) {
    response.status(401).send("Nie zalogowano!");
    return;
  }

  const { data, error } = await supabase
    .from("auditions")
    .insert([{ title: req.body.title, description: req.body.description }]);

  if (error) {
    console.error(error);
    response.status(500).send("Niestety natrafiono na problem z bazą danych!");
  } else {
    response.status(200).send("Pomyślnie dodano audycję!");
  }
});

api.get("/isLoggedIn", async (req, response) => {
  response.status(200).send(await isLoggedIn(req));
});

api.get("/iAmRoot", async (req, response) => {
  response
    .status(200)
    .send(await checkForPermission(await getUsernameFromCookies(req), "root"));
});

api.get("/iAmAdmin", async (req, response) => {
  response
    .status(200)
    .send(await checkForPermission(await getUsernameFromCookies(req), "admin"));
});
