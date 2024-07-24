const express = require('express');
const mainController = require('../controllers/mainController');
const authController = require('../controllers/authController');
const router = express.Router(); // Create a router instance

router
    .get('/', authController.isLoggedIn, mainController.getOverview)
    .get('/about', authController.isLoggedIn, (req, res) => {
        res.render('about', { 
            title: "About us", activePage: 'about' 
        });
    })
    .get('/services', authController.isLoggedIn, (req, res) => {
        res.render('services', { 
            title: "Services", activePage: 'services' 
        });
    })
    .get('/properties', authController.isLoggedIn, mainController.getAllProperties)
    .get("/property/new",
        authController.protect,
        authController.restrictTo(),
        authController.isLoggedIn,
        mainController.newProperty
    )
    .get("/properties/search", authController.isLoggedIn, mainController.searchProperties)
    .get("/property/:id", authController.isLoggedIn, mainController.getProperty)
    .get('/register', authController.isLoggedIn, mainController.getSignup)
    .get('/login', mainController.getLogin)
    .get('/account', authController.protect, authController.restrictTo(), authController.isLoggedIn, mainController.account)
    .get('/profile/listings', authController.protect, authController.restrictTo(), authController.isLoggedIn, mainController.mylistings)
    .get('/profile/performance', authController.protect, authController.restrictTo(), authController.isLoggedIn, mainController.performance)
    .get('/profile/notifications', authController.protect, authController.isLoggedIn, mainController.notifications)
    .get('/property/:id/edit', authController.protect, authController.isLoggedIn, mainController.updateProperty)
    .get('/bookmarks', authController.protect, mainController.getBookmarks)
    .get('/me', authController.isLoggedIn, mainController.getMe)
    .get('/*', authController.isLoggedIn, mainController.getErrorPage);

module.exports = router;
