const express = require("express");
const app = express();
const path = require('path')
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.use("/scripts", express.static(__dirname + "/node_modules/web3.js-browser/build/"));
app.listen(3000);

const fs = require("fs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

loadConfig("./config.json");

function loadConfig(file) {
    let obj;
    fs.readFile(file, "utf-8", function (err, data) {
        if (err) { throw err; }
        obj = JSON.parse(data);
        require("./routes/user")(app, obj);
    });
}