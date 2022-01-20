var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var ProductFactory = require('* /cartridge/scripts/factories/product');
var https = require('https');

function sendSmsByHttpRequest(phoneNumber, productInfo) {  
    var accountSid = 'AC5714f287dc9e81b82b214e5cca45d5df';
    var token = '708b32ee129d7da0c7630a844e09e484';   

    var postData = 'To=' + phoneNumber + '&From=(630) 755-6624' + '&Body=' + productInfo;
    var authorizationData = Buffer.from(accountSid + ':' + token).toString('base64');
    var VERSION  = '3.2.0';      
    var options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Twilio-Client': 'salesforce-' + VERSION,
            'User-Agent': 'twilio-salesforce/' + VERSION,
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8',
            'Authorization': 'Basic ' + authorizationData            
        }
    };
 
    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function (chunk) {
            body = body + chunk;
        });
        res.on('end', function () {
            if (res.statusCode == 201) {
                console.log('Got response: ' + body.length);
            } else {
                console.log('ERROR API call failed with response code:' + res.statusCode);
                console.log(body);
            }
        });
    });
 
    req.on('error', function (e) {
        console.log('ERROR Problem with API call: ' + e.message);
    });
 
    req.write(postData);
    req.end();
}

module.exports.execute = function () {
    console.log('Sms Notification Availability start ...');
    try {
        var type = "Phone_Notification";
        Transaction.wrap(function() {
            var phoneNotifications = CustomObjectMgr.getAllCustomObjects(type);
            while(phoneNotifications.hasNext()) {
                var phoneNotification = phoneNotifications.next();
                var productId = phoneNotification.custom.productid;
                var phones = phoneNotification.custom.phones.split(';');
                var product = ProductFactory.get({ pid: productId }); 
                if (product.available) {
                    for (phone in phones) {
                        sendSmsByHttpRequest(phone, product.name + ' - ' + productId + ' is available.');
                    }
                    CustomObjectMgr.remove(phoneNotification);
                }
            }
        });
        console.log('Sms Notification Availability done.');
    } catch (e) {
        console.log('Sms Notification Availability Error: ' + e.message + '[' + e.FileName + ' : ' + e.lineNumber + ']');
    }
}