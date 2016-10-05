var logger = require('winston');
var applied = false;

var Script = function(mapper, driver) {
    if (applied == false) {
        applied = true;
        try {
            /* Battle Options */

            // Change the FIGHT option.
            driver.write_hex('7455', ['8A', '88', '8B', '8B', '7F']);
            // Change the FLEE option.
            driver.write_hex('745E', ['92', '93', '94', '85', '85']);

        } catch (ex) {
            logger.error(ex);
        }
    }
};

module.exports = Script;
