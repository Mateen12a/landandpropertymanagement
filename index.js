const express = require("express");
const expressLayout = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const path = require("path")


const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import and use your routes
const mainRouter = require('./routes/mainRoute');

// views engine
app.use(expressLayout);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');
app.use(express.static('public'));

app.use('/', mainRouter);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});