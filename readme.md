# 0. What is MQTT ?

From <http://mqtt.org/>  :  
*MQTT stands for MQ Telemetry Transport. It is a publish/subscribe, extremely simple and lightweight messaging protocol, designed for constrained devices and low-bandwidth, high-latency or unreliable networks. The design principles are to minimise network bandwidth and device resource requirements whilst also attempting to ensure reliability and some degree of assurance of delivery. These principles also turn out to make the protocol ideal of the emerging “machine-to-machine” (M2M) or “Internet of Things” world of connected devices, and for mobile applications where bandwidth and battery power are at a premium.*

In nutshell, MQTT works with publishers, subscribers and topics. Anyone can publish to any topic hierarchy such as *device/23ED5E/temperature* and anyone can subscribe to any topics.  
MQTT needs brokers to interface between publishers and subscribers, you can build a broker locally with products such as <http://www.hivemq.com> or you can use for ex. IBM Watson IOT platform as your MQTT broker.

**What are we trying to do ?**
We want to create a node.js server that will be called by Sigfox callbacks. This server will take the payload sent by the IOT device and publish it to the MQTT broker. It's a very simple middleware between Sigfox and MQTT.

In Sigfox backend the device is part of a deviceType container that will define the callback behaviour, eg which server is called when a message hits the backend. Our middleware will take inbound data, check it, eventually reformat it and publish. We assume that this middleware will take only one deviceType, therefore only one callback. Multiple callbacks for multiple deviceTypes will be handled by multiple independant node.js servers.

Some links :

* A good blog article on this <https://blog.risingstack.com/getting-started-with-nodejs-and-mqtt/>
* IBM DeveloperWorks article : <https://www.ibm.com/developerworks/cloud/library/cl-mqtt-bluemix-iot-node-red-app/>


# 1. Setup the node application

First install [locatunnel](https://localtunnel.github.io/www/) and run it :

```bash
npm install -g localtunnel
lt --port 3000
```

You should get an URL like this : http://iqybgxdslx.localtunnel.me

Let’s bootstrap our Express application :

```bash
npm install express-generator -g
express sigfoxMqtt
```

Now that the frame is created, let’s go ahead, install dependencies and run it :

```bash
cd sigfoxMqtt/
npm install
nodemon app.js
```

Now if you go to <http://localhost:3000> or <http://iqybgxdslx.localtunnel.me> you should see :


#2. Try the first POST route

Good! Let’s modify this code to create something useful.

```bash
npm install -S winston
```

Now create the logger.js file with this code :

```javascript
// A short library where you put all your logger parameters.
// See https://github.com/winstonjs/winston
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
    ]
  });

module.exports = logger;
```

Add it to 'app.js' and 'route/index.js'.  

Now add the POST data route to 'index.js'

```javascript
/* POST data */
router.post('/data', function(req, res, next) {
    logger.info("POST" + JSON.stringify(req.body));
    next();
});
```

Restart the npm server with the following commands :

```bash
npm start
```

Now you should install the [Postman Chrome Extension](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop)

And you can try it with your server :

```json
URL : your localtunnel url  /data/
Method POST
Header : Content-Type : application/json (if you forget this POSTMAN won’t work)
Body Raw JSON :
{
	"time" : "{time}",
	"device" : "{device}",
	"duplicate" : "{duplicate}",
	"snr" : "{snr}",
	"rssi" : "{rssi}",
	"avgSnr" : "{avgSnr}",
	"station" : "{station}",
	"lat" : "{lat}",
	"lng" : "{lng}",
	"seqNumber" : "{seqNumber}",
	"data" : "{data}"
}
```

When you hit SEND you should see this in your console window :

```json
info: POST{"time":"{time}","device":"{device}","duplicate":"{duplicate}","snr":"{snr}","rssi":"{rssi}","avgSnr":"{avgSnr}","station":"{station}","lat":"{lat}","lng":"{lng}","seqNumber":"{seqNumber}","data":"{data}"}

```

# 3. Add some authentication

The Middleware will be used by a single server (the Sigfox server) and this should not change.
Therefore we can use basic-auth-connect :

```bash
npm install -S basic-auth-connect
```

Add these lines to the app.js

Create a new auth.js file with :

```javascript
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
```

You can now protect any route by adding auth.basicAuthentication to the route middleware. "route/index.js" is now :

```javascript
var auth = require("../auth.js");

router.post("/data", auth.basicAuthentication, function(req, res, next) {
    logger.info("POST" + JSON.stringify(req.body));
    // return the body received
    res.send(JSON.stringify(req.body));

});
```

This is **VERY** basic, but if we are using https between Sigfox servers and our Middleware the authorization token will not be disclosed, so no risk for interception.

Now to test this, go to Postman, choose basic Auth, fill in your login and password , click on refresh Headers and you should have a new header line with the right token.

If you want to calculate your token :

```bash
> echo 'testUser:testPass' | base64
dGVzdFVzZXIrdGVzdFBhc3MK
```

The header is
```bash
Authorization : Basic dGVzdFVzZXIrdGVzdFBhc3MK
```

# 4. Connect to Sigfox Callback

Go to <https://backend.sigfox.com/>  
Go to Device type and click on the type’s name,   
Click Callbacks on the left hand side and new and Custom callback  
The parameters for the callback are :  

```json
Type DATA UPLINK
Channel URL
URL Pattern http://tgesxrvorp.localtunnel.me/data/
HTTP Method POST
Headers : Authorization : Basic dGVzdFVzZXIrdGVzdFBhc3MK // Change to your token
Content type : application/json
Body :
{
"time" : "{time}",
"device" : "{device}",
"duplicate" : "{duplicate}",
"snr" : "{snr}",
"rssi" : "{rssi}",
"avgSnr" : "{avgSnr}",
"station" : "{station}",
"lat" : "{lat}",
"lng" : "{lng}",
"seqNumber" : "{seqNumber}",
"data" : "{data}"
}
```

You can now connect your eval board and send a message.
I use SmartEverything board, with the Library 'default example DataModeEu'

You should get in your console :

```json
info: POST{"time":"1476826723","device":"17AA7B","duplicate":"false","snr":"11.47","rssi":"-131.00","avgSnr":"39.53","station":"0DC6","lat":"49","lng":"2","seqNumber":"11","data":"48656c6c6f"}
```

In order to continue the testing without worrying too much about my dev board, I will copy/paste the body content into POSTMAN so that I can test easily.

# 5. Content validation

We want to make sure that the info passed in the POST are sound and valid.
Let’s install express-validator :

```bash
npm install -S express-validator
```

Add this to the app.js

```javascript
var validator = require("express-validator");
…
app.use(validator()); // This MUST be right after app.use(bodyParser.urlencoded({ extended: false }));
```

And now we can modify our router POST function to add the validations :

```javascript
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
        res.send(errors);
        return;
    } else {
        // Normal processing
        // return the body received
        res.send(JSON.stringify(req.body));
    }

});
```

**At this point you MUST create your custom validation for your data pattern.**

You now have a working server that will accept incoming data from Sigfox callbacks. You can start from there and do anything useful for you (for ex : store the data received in a db). We will continue with another application, MQTT client.

# 6. MQTT client

Let’s install our MQTT client :

```bash
npm install mqtt --save
```

create a new mqtt.js file and use this code :

```javascript
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
```

We are using a public MQTT broker from <http://www.hivemq.com>, you can then see the messages (among many many others) in <http://www.mqtt-dashboard.com/>   
Change the POST route in index.js to this :  

```javascript
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
```
If you go to POSTMAN and hit the send button again, then go quickly to <http://www.mqtt-dashboard.com/> you should see your message in the **Recently used topic** on the right handside.

Good : we can publish our message to a MQTT Broker.
