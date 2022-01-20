'use strict';

/**
 * @namespace Twilio
 */

var server = require('server');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var cache = require('*/cartridge/scripts/middleware/cache');
var ProductFactory = require('*/cartridge/scripts/factories/product');

/**
 * SMS notification 
 * @name AddPhoneToSmsNotificaton
 * @param {returns} - json
 * @param {serverfunction} - post
 */
 server.post('AddPhoneToSmsNotificaton', server.middleware.https, function (req, res, next) {
    try {
        var note = 'Notification was saved.';
        var phoneNumber = req.form.phoneNumber;
        var productId = req.form.productId;

        var type = "Phone_Notification";
        Transaction.wrap(function() {
            var phoneNotifications = CustomObjectMgr.getAllCustomObjects(type);
            var isFound = false;
            while(phoneNotifications.hasNext())
            {
                var phoneNotification = phoneNotifications.next();
                if (phoneNotification.custom.productid === productId)
                {
                    isFound = true;
                    if (phoneNotification.custom.phones.indexOf(phoneNumber) === -1)
                    {
                        phoneNotification.custom.phones = phoneNotification.custom.phones + ";" + phoneNumber;
                        note = 'Phone number ' + phoneNumber + ' was added to existing notification.';
                    }
                    else 
                    {
                        note = 'Allready have existing notification.';
                    }
                }
            }
            if (!isFound)
            {
                var keyValue = UUIDUtils.createUUID();
                var newPhoneNotification = CustomObjectMgr.createCustomObject(type, keyValue);
                newPhoneNotification.custom.productid = productId;
                newPhoneNotification.custom.phones = phoneNumber;
                note = 'New notification to pphone number ' + phoneNumber + ' was added.';
            }
        });

        res.json({
            success: true,
            message: note
        });
    } catch (e) {
        res.json({
            success: false,
            message: e.message + "[" + e.FileName + " : "+ e.lineNumber + "]"
        });
    }
    next();
});

module.exports = server.exports();