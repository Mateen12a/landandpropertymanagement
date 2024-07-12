const express = require('express');
const router = express.Router(); // Create a router instance

router.get('/', (req, res) => {
    res.render('home', { activePage: 'home' });
});

router.get('/about', (req, res) => {
    res.render('about', { activePage: 'about' });
});

router.get('/services', (req, res) => {
    res.render('services', { activePage: 'services' });
});

router.get('/properties', (req, res) => {
    res.render('properties', { activePage: 'properties' });
});

router.get('*', (req, res) => { // Catch-all route for 404 errors
    res.render('home', { activePage: 'home' }); // Render a 404 page (create one!)
});

module.exports = router;