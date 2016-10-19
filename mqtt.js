var mqtt = require('mqtt');
var logger = require('./logger.js');

var client  = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', function() {
   logger.info("Connected to MQTT"); 
});

client.on('error', function() {
    logger.error('MQTT Error');
});

exports.publish = function( deviceId, subtopic, data ){
    if (client.connected == true) {
        client.publish('sigfox/' + deviceId + '/' + subtopic, data); 
    }
    else {
        logger.error("MQTT not connected and tried to send msg: " + deviceId + ',' + subtopic + ',' + data);    
    }
}
