const mysql = require("mysql");
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "100962Austin@",
  database: "mydb",
  multipleStatements: true,
});
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = con;
