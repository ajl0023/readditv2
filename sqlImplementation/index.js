const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const path = require("path");
const dbConnection = require("./dbFunctions");

app.use(cookieParser());
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
app.use(express.static(path.join(__dirname, "./client")));
app.use(express.json());
const checkauth = (req, res, next) => {
  req.user = "09806985-cbf9-11eb-be87-7085c27ba6fd";
  next();
};

app.listen(process.env.PORT || 5000, async () => {
  app.use(checkauth);
  require("./routes")(app, dbConnection);
});

module.exports = app;
