// A short library where you put all your logger parameters. 
// See https://github.com/winstonjs/winston 
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
    ]
  });

module.exports = logger;