const express = require('express');
const mainController = require('../controllers/mainController')
const authController = require('../controllers/authController')
const router = express.Router(); // Create a router instance

router
    .get('/', authController.isLoggedIn, mainController.getOverview)
    .get('/about',  authController.isLoggedIn,(req, res) => {
    res.render('about', { 
        title: "About us", activePage: 'about' });
    })
    .get('/services',  authController.isLoggedIn,(req, res) => {
    res.render('services', { 
        title: "Services", activePage: 'services' });
    })
    .get('/properties',  authController.isLoggedIn,mainController.getAllProperties)
    .get("/property/new",
        authController.protect,
        authController.restrictTo(),
        mainController.newProperty
      )
    .get("/properties/search", authController.isLoggedIn, mainController.searchProperties)
    .get("/property/:id", authController.isLoggedIn, mainController.getProperty)
    .get('/register',  authController.isLoggedIn, mainController.getSignup)
    .get('/login',  mainController.getLogin)
    .get('/*', mainController.getErrorPage);

module.exports = router;