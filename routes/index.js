var express = require('express');
var router = express.Router();
var logger = require('../logger.js');
var auth = require('../auth.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
    logger.info("index called");
});

/* POST data */ 
router.post('/data', auth.basicAuthentication, function(req, res, next) {
    logger.info("POST" + JSON.stringify(req.body));
    // return the body received 
    res.send(JSON.stringify(req.body));
    
});

module.exports = router;
