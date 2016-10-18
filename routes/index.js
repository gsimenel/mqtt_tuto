var express = require('express');
var router = express.Router();
var logger = require('../logger.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
    logger.info("index called");
});

/* POST data */ 
router.post('/data', function(req, res, next) {
    logger.info("POST" + JSON.stringify(req.body));
    next();
    //res.send('Got POST');
});

module.exports = router;
