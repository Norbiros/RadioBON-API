const librus = require("librus-api");
const jsdom = require("jsdom");
const crypto = require("crypto");
const axios = require("axios").default;
const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");
const reader = require("any-text");

// We need to make it one-time function because it is slow, and it doesn't need to be updated per request
let dinnersData = new Promise(async function (resolve) {
    const html = await (
        await axios.get("https://sp40krakow.edupage.org/teachers/")
    ).data; // html as text
    const doc = new jsdom.JSDOM(html).window.document;
    let link = doc
        .querySelector("#teachers_Html_2")
        .querySelector("a").href;
    link = link.replace("//", "https://");
    let file = fs.createWriteStream("/tmp/food.docx");
    http.get(link, function (response) {
        response.pipe(file);
        file.on("finish", function () {
            reader.getText("/tmp/food.docx").then(function (data) {
                data = data.replace(/ *\([^)]*\) */g, " ").trim();
                data = data.replaceAll(" , ", ", ");
                let objects = [];
                let reg = /([0-3]?[0-9]\.[0-1][0-9]\.2[0-9])[A-ZŚ][^A-ZŚ]+([^.]+)/gm;
                let result;
                while ((result = reg.exec(data)) !== null) {
                    let el = {};
                    el.date = result[1];
                    el.text = result[2];
                    objects.push(el);
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

        const {data, error} = await supabase
            .from("users")
            .select()
            .eq("username", req.body.username)
            .eq("password", hashedPassword);

        if (error) console.error(error);
        return data.length > 0;
    },
    checkForPermission: async function (username, permission, supabase) {
        const {data, error} = await supabase
            .from("users")
            .select()
            .eq("username", username)
            .eq("permission", permission);
        if (error) console.error(error);
        return data.length > 0;
    },
    isLoggedIn: async function (req, supabase) {
        const {data, error} = await supabase
            .from("sessions")
            .select()
            .eq("session_id", req.cookies.sessionId);
        if (error) console.error(error);
        return data.length > 0;
    },
    getUsernameFromCookies: async function (req, supabase) {
        const {data, error} = await supabase
            .from("sessions")
            .select()
            .eq("session_id", req.cookies.sessionId);
        if (error) console.error(error);
        if (!data[0]) return false;
        return data[0].username;
    },
    fetchKalibiData: async function (limit) {
        const html = await (
            await axios.get("https://www.kalbi.pl/kalendarz-swiat-nietypowych")
        ).data; // html as text
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
