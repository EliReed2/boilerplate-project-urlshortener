const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");
const { escape } = require("querystring");
require("dotenv").config();

//Connecting to Mongoose
mongoose.connect(process.env.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const linkSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: String,
    required: true,
  },
});

const Link = mongoose.model("Link", linkSchema);

// Basic Configuration
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", async (req, res) => {
  const url = req.body.url;
  try {
    if (!urlVerifier(url)) {
      res.json({ error: "Invalid URL" });
      return;
    }
    const hostname = hostnameCollect(url);

    //Verifying URL
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        res.json({ error: "Invalid URL" });
        return;
      }
    });

    // Checking if URL is already in database
    const isDuplicate = await checkDuplicate(url);

    if (isDuplicate) {
      console.log("Duplicate found");
      const link = await Link.findOne({ original_url: url });

      if (link) {
        const linkShortURL = link.short_url;
        res.json({ original_url: url, short_url: linkShortURL });
      } else {
        console.log("Link not found");
        res.json({ error: "Link not found" });
      }
    } else {
      console.log("No duplicate found");
      const linkShortURL = await addLinkToDB(url);
      res.json({ original_url: url, short_url: linkShortURL });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const hostnameCollect = (url) => {
  const parsedURL = new URL(url);
  return parsedURL.hostname;
};

const urlVerifier = (url) => {
  const regex = /^(http|https):\/\//;
  return regex.test(url);
};

const checkDuplicate = async (originalURL) => {
  try {
    const link = await Link.findOne({ original_url: originalURL });
    return !!link;
  } catch (err) {
    console.error("Error finding link:", err);
    throw err;
  }
};

const checkDuplicateShort = async (shortURL) => {
  try {
    const link = await Link.findOne({ short_url: shortURL });
    return !!link;
  } catch (err) {
    console.error("Error finding link:", err);
    throw err;
  }
};

const addLinkToDB = async (newUrl) => {
  try {
    const count = await Link.countDocuments();
    const newCount = count + 1;

    let newLink = new Link({
      original_url: newUrl,
      short_url: newCount.toString(), // Ensure short_url is a string
    });

    await newLink.save();
    console.log("New link added:", newCount);
    return newCount.toString(); // Return the new short_url as a string
  } catch (err) {
    console.error("Error adding link:", err);
    throw err; // Propagate the error further
  }
};

app.get("/api/shorturl/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;
  if (checkDuplicateShort) {
    const link = await Link.findOne({ short_url: shortUrl });
    res.redirect(link.original_url);
  } else {
    res.json({ Error: "Not Found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
