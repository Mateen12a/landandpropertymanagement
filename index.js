const express = require("express");
const expressLayout = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const path = require("path");
const cookieParser = require('cookie-parser');
const morgan = require("morgan");
const compression = require("compression");
const authController = require("./controllers/authController");
const cors = require('cors');

// Import and use your routes
const mainRouter = require('./routes/mainRoute');
const userRouter = require("./routes/userRoute");
const propertyRouter = require("./routes/propertyRoutes");
const globalErrorHandler = require("./controllers/errorController");



const app = express();
const port = 5000;
const DB = "mongodb+srv://mateen:mateen@cluster0.ydjp5.mongodb.net/RealEstate?retryWrites=true&w=majority";

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Views engine
app.use(expressLayout);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');
// Enable CORS for all routes
app.use(cors());


// Middleware
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "1000kb" }));
app.use(cookieParser());


// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Api routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/property", propertyRouter);

// Main routes
app.use('/', mainRouter);
// Apply isLoggedIn middleware globally
app.use(authController.isLoggedIn);
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
app.use(globalErrorHandler);
// Database connection
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB CONNECTED");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
