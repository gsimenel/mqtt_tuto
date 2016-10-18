// Source : http://www.9bitstudios.com/2015/10/basic-authentication-in-node-js-express-applications-and-apis/

var basicAuth = require('basic-auth');
var logger = require('./logger.js');

exports.basicAuthentication = function(req, res, next) {
 
    function unauthorized(response) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
        
    };
 
    var user = basicAuth(req);
 
    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    };
 
    if (user.name === 'testUser' && user.pass === 'testPass') {
        return next();
    } else {
        logger.error("Authorized : " + user.name + ":" + user.pass);
        return unauthorized(res);
    };
     
};
