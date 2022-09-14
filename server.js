const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const utils = require("./utils");
const app = express();

const supabase = createClient(
  "https://plxghautgvsgtichsmkr.supabase.co",
  process.env.SUPABASE_KEY
);

const PORT = process.env.PORT || 8000;
app.listen(PORT);

console.log("RadioBON API started on port " + PORT + "!");

const corsOptions = {
  origin: process.env.WEBSITE_URL,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.send("RadioBON API!");
});

// Get API to show broadcasts
app.get("/broadcasts", async (req, response) => {
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

app.post("/auth/login", async (req, response) => {
  let verified = await utils.checkCredentials(req, supabase);
  if (verified === true) {
    let sessionId = crypto.randomBytes(16).toString("hex");

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

app.post("/register", async (req, response) => {
  if (
    !(await utils.checkForPermission(
      await utils.getUsernameFromCookies(req, supabase),
      "root",
      supabase
    ))
  ) {
    response.status(401).send("Nie masz uprawnień!");
    return;
  }
  let hashedPassword = crypto
    .createHash("sha256")
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
app.post("/broadcast", async (req, response) => {
  if ((await utils.isLoggedIn(req, supabase)) !== true) {
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

app.get("/isLoggedIn", async (req, response) => {
  response.status(200).send(await utils.isLoggedIn(req, supabase));
});

app.get("/iAmRoot", async (req, response) => {
  response
    .status(200)
    .send(
      await utils.checkForPermission(
        await utils.getUsernameFromCookies(req, supabase),
        "root",
        supabase
      )
    );
});

app.get("/iAmAdmin", async (req, response) => {
  response
    .status(200)
    .send(
      await utils.checkForPermission(
        await utils.getUsernameFromCookies(req, supabase),
        "admin",
        supabase
      )
    );
});

app.get("/librusAnnouncements", async (req, response) => {
  if (
    await utils.checkForPermission(
      await utils.getUsernameFromCookies(req, supabase),
      "admin",
      supabase
    )
  ) {
    response.status(401).send("Nie masz dostępu!");
    return;
  }
  response.status(200).send((await utils.fetchLibrusData()).slice(0, 15));
});

app.get("/specialDays", async (req, response) => {
  response.status(200).send(await utils.fetchKalibiData(req.query.limit));
});

module.exports = {
  app,
};
