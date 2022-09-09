//const fetch = require("node-fetch");
//const librus = require("librus-api");
//const jsdom = require("jsdom");
const crypto = require("crypto");

const server = require("./server.js");
const { supabase } = require("./server");
/*
module.exports = async function fetchKalibiData() {
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
  return descriptions;
};

module.exports = async function fetchLibrusData() {
  let c = new librus();
  let librusClient = c.authorize("", "").then(function () {
    return c.info.getNotifications();
  });
  return await librusClient;
};
*/

module.exports = {
  checkCredentials: async function (req) {
    let hashedPassword = crypto
      .createHash("sha256")
      .update(req.body.password)
      .digest("hex");

    const { data, error } = await server.supabase
      .from("users")
      .select()
      .eq("username", req.body.username)
      .eq("password", hashedPassword);

    if (error) console.error(error);
    return data.length > 0;
  },
  checkForPermission: async function (username, permission) {
    const { data, error } = await server.supabase
      .from("users")
      .select()
      .eq("username", username)
      .eq("permission", permission);
    if (error) console.error(error);
    return data.length > 0;
  },
  isLoggedIn: async function (req) {
    const { data, error } = await server.supabase
      .from("sessions")
      .select()
      .eq("session_id", req.cookies.sessionId);
    console.log(data);
    if (error) console.error(error);
    return data.length > 0;
  },
  getUsernameFromCookies: async function (req) {
    const { data, error } = await server.supabase
      .from("sessions")
      .select()
      .eq("session_id", req.cookies.sessionId);
    if (error) console.error(error);
    if (!data[0]) return false;
    return data[0].username;
  },
};
