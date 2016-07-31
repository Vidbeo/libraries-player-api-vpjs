(function (vpJS, undefined) {
    /*
     * The domain used by embedded players
     * 
     * @type {String}
     */
    var iframeDomain = "https://vidbeo.com";
    
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
    };
    
    /*
     * A message has been received by this page
     *
     * @method receivedMessage
     * @param {Object} message
     * @return {}
     * @private
     */
    function receivedMessage(message) {
        // check this message came from an embedded player
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
        if (messageObject.type != "callback") {
            return false;
        }
        
        var alphaNumericRegEx = /^([a-zA-Z0-9]+)$/;
        if (alphaNumericRegEx.test(messageObject.functionName) === false) {
            return false;
        }

        // proceed to call it
        var callback = new Function(messageObject.functionName+'('+messageObject.functionParameter+')');
        callback();
    };
    
    /*
     * Make a request to a player embedded in an iframe on this page
     *
     * @method request
     * @param {String} iframeId
     * @param {String} functionName
     * @param {Object} functionParameter
     * @param {String} callbackName
     * @return {}
     * @public
     */
    vpJS.request = function(iframeId, functionName, functionParameter, callbackName) {
        if (typeof JSON.stringify !== 'function') {
        // it is not possible to send the message without JSON support
            return false;
        }
        
        var iframe = document.getElementById(iframeId);
        if (iframe == null) {
        // iframe element to send the message to can not be found - perhaps not been added to page, or invalid id, or lazy-loaded and not been played yet
            return false;
        }
        
        // build the message as an object which will then be sent JSON-encoded
        var messageObject = {};
        messageObject.functionName = functionName;
        messageObject.functionParameter = typeof functionParameter !== 'undefined' ? functionParameter : null;
        messageObject.callbackName = typeof callbackName !== 'undefined' ? callbackName : null;
        var message = JSON.stringify(messageObject);
              
        // send the message
        iframe.contentWindow.postMessage(message, iframeDomain);
    };
    
    init();
})(window.vpJS = window.vpJS || {});
