const fs = require("fs");
const key = fs.readFileSync(
  "./library-management-system-23-firebase-adminsdk.json",
  "utf8"
);
const base64 = Buffer.from(key).toString("base64");
