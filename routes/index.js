var express = require('express');
var router = express.Router();
var logger = require('../logger.js');
var auth = require('../auth.js');

var mqtt = require('../mqtt.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
    logger.info("index called");
});

/* POST data */ 
router.post('/data', auth.basicAuthentication, function(req, res, next) {
    logger.info("POST" + JSON.stringify(req.body));
    
    req.checkBody("time", "Enter a valid timestamp").isInt();
    req.checkBody("device", "Enter an hexa number").isHexadecimal();
    req.checkBody("duplicate", "Enter true/false").isBoolean();
    req.checkBody("snr", "Enter a valid float").isFloat();
    req.checkBody("avgSnr", "Enter a valid float").isFloat();
    req.checkBody("station", "Enter a valid Station ID").isHexadecimal();
    req.checkBody("lat", "Enter a valid lat").isInt();
    req.checkBody("lng", "Enter a valid lng").isInt();
    req.checkBody("seqNumber", "Enter a valid seq").isInt();
    req.checkBody("data", "Enter a valid data").isHexadecimal();
    
    var errors = req.validationErrors();
    if (errors) {
        logger.error(errors);
        res.send(errors);
        return;
    } else {
        // Normal processing 
        // return the body received 
        mqtt.publish( req.body.device, 'test', req.body.data);
        res.send(JSON.stringify(req.body));
    }

});

module.exports = router;
