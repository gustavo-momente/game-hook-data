// Dragon Warrior 1 Stats Script

var logger = require('winston');

var last_position = 0;
var Script = function(mapper, driver) {
    try {
        var vars = mapper.properties;

        // Detection if you're standing on specific tiles.
        // Eventually send key to RetroArch to automatically use stairs / chest.
        var position = vars.player.position.x.value + vars.player.position.y.value;
        if (position != last_position) {
            if (vars.terrain.value == 'STAIRS') {
                console.log('Standing on STAIRS.');
            } else if (vars.terrain.value == 'CHEST') {
                console.log('Standing on CHEST.');
            }
            last_position = position;
        }

        /*
        // Always fight the Dragonlord, except when already in Form 2.
        if (vars.enemy.hex != '26' && vars.enemy.hex != '27') {
          driver.write_hex(vars.enemy.address, ['26']);
        }*/

        // Maximum Stats
        driver.write_property(vars.player.level, 99);
        driver.write_property(vars.player.health, 255);
        driver.write_property(vars.player.max_health, 255);
        driver.write_property(vars.player.magic, 255);
        driver.write_property(vars.player.max_magic, 255);
        driver.write_property(vars.player.attack, 255);
        driver.write_property(vars.player.defense, 255);
        driver.write_property(vars.player.gold, 255);
        driver.write_property(vars.player.magic_keys, 255);

    } catch (ex) {
        logger.error(ex);
    }
};

module.exports = Script;
