import fetch from "node-fetch";
import librus from "librus-api";
import jsdom from "jsdom";
const { createHash } = await import("node:crypto");

export async function fetchKalibiData() {
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
}

export async function fetchLibrusData() {
  let c = new librus();
  let librusClient = c.authorize("", "").then(function () {
    return c.info.getNotifications();
  });
  return await librusClient;
}

export async function checkCredentials(req, client) {
  let res = await client.query("select * from passwords;");
  let hashedPassword = createHash("sha256")
    .update(req.body.password)
    .digest("hex");
  return !!res.rows.find(
    (e) => req.body.username == e.username && hashedPassword == e.password
  );
}

export async function isLoggedIn(req, client) {
  let res = await client.query("select * from sessions;");
  return !!res.rows.find((e) => e.sessionid === req.cookies.sessionId);
}
