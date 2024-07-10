require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const bodyParser = require("body-parser");
const { error } = require("console");
const { SocketAddress } = require("net");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/shorturl", (req, res, next) => {
  const url = req.body.url;
  const parsedUrl = new URL(url);
  dns.lookup(parsedUrl.hostname, (err, address, family) => {
    if (err) {
      res.json({ error: "Url Error" });
    }
    next();
  });
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
