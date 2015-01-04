(function (vpJS, undefined) {
    /*
     * The domain used by embedded players
     * 
     * @type {String}
     */
    var iframeDomain = "https://vidbeo.com"; // ***** IF USING A CUSTOM DOMAIN, PLEASE UPDATE THIS VALUE *****
    
    /*
     * The players embedded on this page
     * 
     * @type {Array}
     */
    var players = [];
    
    /*
     * Initialise the player API for communicating with the iframes containing embedded players
     *
     * @method init
     * @private
     */
    function init() {
        // attach an event listener for messages sent to this page by any iframe ...
        if (window.addEventListener) {
            window.addEventListener("message", receivedMessage, false);
        }
 
        else {
            window.attachEvent("onmessage", receivedMessage); // IE (before version 9)
        }
    };
    
    /*
     * A message has been received by this page
     *
     * @method receivedMessage
     * @param {Object} message
     * @return {Bool}
     * @private
     */
    function receivedMessage(message) {
        // check this message came from one of embedded players
        if (message.origin != iframeDomain) {
            return false;
        }
 
        var messageData = message.data;
 
        var messageObject = JSON.parse(messageData);
        if (messageObject == null) {
            return false;
        }
 
        // are all of the expected attributes present?
        if (!messageObject.hasOwnProperty('type') || !messageObject.hasOwnProperty('functionName') || !messageObject.hasOwnProperty('functionParameter')) {
            return false;
        }
        
        // check the type is supported
        if (messageObject.type != "ready" && messageObject.type != "callback") {
            return false;
        }
        
        var alphaNumericRegEx = /^([a-zA-Z0-9]+)$/;
        
        // if the type is "ready", this is an internal message that simply records that fact (meaning other functions can now be called)
        if (messageObject.type == "ready") {
            // the 10-character id of the now-ready player is passed as the parameter
            if (messageObject.functionParameter.length != 10 || alphaNumericRegEx.test(messageObject.functionParameter) === false) {
                return false;
            }
            
            players[messageObject.functionParameter] = "ready";
        }
        
        else {
            // else the message is to request a callback function, so check the function's name
            if (alphaNumericRegEx.test(messageObject.functionName) === false) {
                return false;
            }
 
            // else proceed to call it
            var callback = new Function(messageObject.functionName+'('+messageObject.functionParameter+')');
            callback();
        }
        
        return true;
    };
    
    /*
     * Make a request to a player embedded in an iframe
     *
     * @method request
     * @param {String} iframeId
     * @param {String} action
     * @param {String} embedId
     * @param {Int|String} parameter1
     * @param {Int|String} parameter2
     * @return {Bool}
     * @public
     */
    vpJS.request = function(iframeId, action, embedId, parameter1, parameter2) {
        if (typeof players[embedId] == 'undefined') {
        // an embedded player is only added to the players array once a ready message is received from it, so it's not yet ready
            return false;
        }
        
        if (typeof JSON.stringify !== 'function') {
        // it is not possible to send the message without JSON support
            return false;
        }
        
        // build the message as an object which will then be sent JSON-encoded
        var messageObject = {};
        messageObject.action = action;
        messageObject.embedId = embedId;
        messageObject.parameter1 = typeof parameter1 !== 'undefined' ? parameter1 : null;
        messageObject.parameter2 = typeof parameter2 !== 'undefined' ? parameter2 : null;
        
        var message = JSON.stringify(messageObject);
        
        var iframe = document.getElementById(iframeId);
 
        // send the message
        iframe.contentWindow.postMessage(message, iframeDomain);
        
        return true;
    };
    
    init();
})(window.vpJS = window.vpJS || {});
