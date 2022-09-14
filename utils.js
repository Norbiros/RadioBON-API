const librus = require("librus-api");
const jsdom = require("jsdom");
const crypto = require("crypto");

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
  fetchKalibiData: async function () {
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
  },
  fetchLibrusData: async function () {
    let c = new librus();
    let librusClient = c
      .authorize(process.env.LIBRUS_USERNAME, process.env.LIBRUS_PASSWORD)
      .then(function () {
        return c.inbox.listAnnouncements();
      });
    return await librusClient;
  },
};
