const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
//Sign in with jwt

const signToken = (id) =>
  jwt.sign({ id }, "my-ultra-secure-and-ultra-long-secret-two", {
    expiresIn: "90d",
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if ("production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    contact: req.body.contact,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password exit
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  //check if user exits && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //if everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "Logged out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check if token is in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log('Token from header:', token); // Debug log to check token from header
  } 
  // 2. Check if token is in cookies
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log('Token from cookie:', token); // Debug log to check token from cookie
  }

  // 3. If token is not provided, log the error and send a response
  if (!token) {
    console.log('No token provided'); // Debug log if no token is provided
    return next(new AppError("You are not logged in, please login to get access", 401));
  }

  // 4. Verify the token
  const decoded = await promisify(jwt.verify)(token, "my-ultra-secure-and-ultra-long-secret-two");
  console.log('Decoded token:', decoded); // Debug log to check the decoded token

  // 5. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    console.log('User not found'); // Debug log if user not found
    return next(new AppError("The user with this token does not exist", 401));
  }

  // 6. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("User recently changed password: Please log in again", 401));
  }

  // 7. Grant access to the protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  console.log('Inside isLoggedIn Middleware');
  console.log('Cookies:', req.cookies);

  if (req.cookies && req.cookies.jwt) {
      try {
          const decoded = await promisify(jwt.verify)(
              req.cookies.jwt,
              'my-ultra-secure-and-ultra-long-secret-two'
          );

          const currentUser = await User.findById(decoded.id);

          if (!currentUser) {
              res.locals.user = null;
              return next();
          }

          if (currentUser.changedPasswordAfter(decoded.iat)) {
              res.locals.user = null;
              return next();
          }

          res.locals.user = currentUser;
          console.log('User set in res.locals:', res.locals.user);
          return next();
      } catch (error) {
          res.locals.user = null;
          return next();
      }
  } else {
      res.locals.user = null;
      next();
  }
};

exports.restrictTo =
  (...roles) =>
  // roles ['admin', 'user', 'agent'] is array
  (req, res, next) => {
    if (req.user.role == "User" || req.user.role == "user")
      return next(
        new AppError("You do not have permission for this action", 404)
      );
      console.log("Role: ", req.user.role)
    next();
  };

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  //2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Incorrect current password", 401));
  }

  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // User.findByIdAndUpdate will NOT work as intended!

  //4) Log user in, send JWT
  createSendToken(user, 200, res);
});
