const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(?<=")[^"]*(?=")/);
  const message = `Duplicate field value ${value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data, ${errors.join(". ")}`;

  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError(`Invalid token, Please log in again`, 401);

const handleJWTExpiredToken = () =>
  new AppError("Your token has expired, please log in again");

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDERED WEBSITE
  return res.status(err.statusCode).render("404", {
    title: "Something went wrong!",
    msg: err.message, 
    activePage: '404' 
  });
};

const sendErrorProd = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith("/api")) {
    //operational error , trustee error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      //Programming or other unknown error
    }
    console.error("Error 😑🤬😡😡", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
  //B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render("404", {
      title: "Something went wrong!",
      msg: err.message, 
      activePage: '404' 
    });

    //Programming or other unknown error
  }
  console.error("Error 😑🤬😡😡", err);
  return res.status(err.statusCode).render("404", {
    title: "Something went wrong!",
    msg: "Please try again later", 
    activePage: '404' 
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if ("development") sendErrorDev(err, req, res);
  else if ("production") {
    let error = { ...err };
    error.name = err.name;
    error.message = err.message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.name === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    sendErrorProd(error, req, res);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredToken();
  }
};
