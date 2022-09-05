import fetch from "node-fetch";
import librus from "librus-api";
import jsdom from "jsdom";
const { createHash } = await import("node:crypto");

import { supabase } from "./server.js";

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

export async function checkCredentials(req) {
  let hashedPassword = createHash("sha256")
    .update(req.body.password)
    .digest("hex");

  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("username", req.body.username)
    .eq("password", hashedPassword);

  if (error) console.error(error);
  return data.length > 0;
}

export async function checkForPermission(username, permission) {
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("username", username)
    .eq("permission", permission);
  if (error) console.error(error);
  return data.length > 0;
}

export async function isLoggedIn(req) {
  const { data, error } = await supabase
    .from("sessions")
    .select()
    .eq("session_id", req.cookies.sessionId);
  console.log(data);
  if (error) console.error(error);
  return data.length > 0;
}

export async function getUsernameFromCookies(req) {
  const { data, error } = await supabase
    .from("sessions")
    .select()
    .eq("session_id", req.cookies.sessionId);
  if (error) console.error(error);
  if (!data[0]) return false;
  return data[0].username;
}
