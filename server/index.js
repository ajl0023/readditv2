const jwt = require("jsonwebtoken");
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
const path = require("path");
app.use(cookieParser());
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
app.use(express.static(path.join(__dirname, "./client")));
app.use(express.json());
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./client", "index.html"));
});

app.listen(process.env.PORT || 5000, () => {
  console.log("connected");
});
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const corsOptions = {};
app.use(cors(corsOptions));
const checkauth = (req, res, next) => {
  if (req.headers.authorization) {
    const refreshToken = req.cookies.refresh;
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, payload) => {
      if (err) {
        req.user = null;
      } else {
        req.user = payload;
      }
    });
  }
  next();
};

app.use(checkauth);

require("./api/reddit-api")(app);
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client", "index.html"));
});
module.exports = app;
