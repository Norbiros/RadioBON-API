const librus = require("librus-api");
const jsdom = require("jsdom");
const crypto = require("crypto");
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const reader = require("any-text");

// We need to make it one-time function because it is slow, and it doesn't need to be updated per request
let dinnersData = new Promise(async function (resolve) {
  const html = await (
    await fetch("https://sp40krakow.edupage.org/teachers/")
  ).text(); // html as text
  const doc = new jsdom.JSDOM(html).window.document;
  let link = doc
    .querySelector("#teachers_Html_2")
    .lastChild.querySelector("a").href;
  link = link.replace("//", "https://");
  let file = fs.createWriteStream("food.docx");
  http.get(link, function (response) {
    response.pipe(file);
    file.on("finish", function () {
      reader.getText(`food.docx`).then(function (data) {
        let objects = [];
        let loop = 0;
        let reg = /[0-9][0-9]?\.[0-9][0-9]?\.22/gm;
        let result;
        while ((result = reg.exec(data)) !== null) {
          let e = data.split(/[0-9][0-9]?\.[0-9][0-9]?\.22/gm)[loop];
          if (!e.includes("JADŁOSPIS")) {
            if (e.includes("ok.")) e = e.replace(".", " ");
            e = e.split(".")[0];
            let el = {};
            el.date = result[0];
            el.text = e.replace(/[A-ZŚ][^A-ZŚ]+/, "");
            objects.push(el);
          }
          loop++;
        }
        resolve(objects);
      });
    });
  });
});

module.exports = {
  checkCredentials: async function (req, supabase) {
    let hashedPassword = crypto
      .createHash("sha256")
      .update(req.body.password)
      .digest("hex");

    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("username", req.body.username)
      .eq("password", hashedPassword);

    if (error) console.error(error);
    return data.length > 0;
  },
  checkForPermission: async function (username, permission, supabase) {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("username", username)
      .eq("permission", permission);
    if (error) console.error(error);
    return data.length > 0;
  },
  isLoggedIn: async function (req, supabase) {
    const { data, error } = await supabase
      .from("sessions")
      .select()
      .eq("session_id", req.cookies.sessionId);
    console.log(data);
    if (error) console.error(error);
    return data.length > 0;
  },
  getUsernameFromCookies: async function (req, supabase) {
    const { data, error } = await supabase
      .from("sessions")
      .select()
      .eq("session_id", req.cookies.sessionId);
    if (error) console.error(error);
    if (!data[0]) return false;
    return data[0].username;
  },
  fetchKalibiData: async function (limit) {
    const html = await (
      await fetch("https://www.kalbi.pl/kalendarz-swiat-nietypowych")
    ).text(); // html as text
    const doc = new jsdom.JSDOM(html).window.document;
    let descriptions = [];
    doc.querySelectorAll(".descritoptions-of-holiday").forEach(function (e) {
      let description = [];
      e.querySelectorAll(".description-of-holiday").forEach(function (el) {
        let desc = {};
        desc.title = el.querySelector("a").textContent;
        desc.description = el
          .querySelector("p")
          ?.textContent?.trim()
          .replace(" ... »", "...");
        description.push(desc);
      });
      descriptions.push(description);
    });
    return descriptions.slice(0, limit ? limit : 10);
  },
  fetchLibrusData: async function () {
    let c = new librus();
    let librusClient = c
      .authorize(process.env.LIBRUS_USERNAME, process.env.LIBRUS_PASSWORD)
      .then(async function () {
        return c.inbox.listAnnouncements();
      });
    return await librusClient;
  },
  dinnersData: dinnersData,
};
