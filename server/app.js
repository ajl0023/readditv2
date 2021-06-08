// const jwt = require("jsonwebtoken");
// const express = require("express");
// const cookieParser = require("cookie-parser");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();
// const app = express();
// const path = require("path");
// app.use(cookieParser());
// const session = require("express-session");
// const MongoStore = require("connect-mongo")(session);
// app.use(express.static(path.join(__dirname, "../client/build")));
// app.use(express.json());
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/build", "index.html"));
// });
// app.listen(process.env.PORT, () => {});
// mongoose.connect(process.env.MONGO_DB, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const corsOptions = {};
// app.use(cors(corsOptions));
// const checkauth = (req, res, next) => {
//   if (req.headers.authorization) {
//     const refreshToken = req.cookies.refresh;
//     jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, payload) => {
//       if (err) {
//         req.user = null;
//       } else {
//         req.user = payload;
//       }
//     });
//   }
//   next();
// };
// const connection = mongoose.createConnection(process.env.MONGO_DB, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const sessionStore = new MongoStore({
//   mongooseConnection: connection,
//   collection: "sessions",
// });
// app.use(
//   session({
//     secret: "somesecret",
//     resave: false,
//     saveUninitialized: true,
//     store: sessionStore,
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24,
//     },
//   })
// );
// app.use(checkauth);

// require("./api/reddit-api")(app);
// app.get("*", function (req, res) {
//   res.sendFile(path.join(__dirname, "../client/build", "index.html"));
// });
// module.exports = app;
// const express = require("express");
// const app = express();
// const axios = require("axios");
// const connect = require("./mongoUtil");
// var cors = require("cors");
// const path = require("path");

// app.use(cors());
// app.use(express.json({ limit: "50mb" }));
// app.use(express.static(path.join(__dirname, "../tftapp/build")));
// connect
//   .connect()
//   .then(() => {
//     app.listen(process.env.PORT || 7000, () => {});
//     require("./routes")(app);
//   })
//   .catch((err) => {});
const express = require("express");

const app = express();

app.get("/", (req, res) => res.send("Home Page Route"));

app.get("/about", (req, res) => res.send("About Page Route"));

app.get("/portfolio", (req, res) => res.send("Portfolio Page Route"));

app.get("/contact", (req, res) => res.send("Contact Page Route"));

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(1));
