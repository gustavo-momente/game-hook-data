// Pokemon Red / Blue Nuzlocke Script

var fs = require('fs');
var logger = require('winston');

// Global across runs of the script.
var state = null;
var inWildCombat = false;
var catchable = null;

function flushState() {
    return fs.writeFileSync('./pokemon_rby_nuzlocke_state.json', JSON.stringify(state), 'utf-8');
}

try {
    fs.accessSync('./pokemon_rby_nuzlocke_state.json', fs.F_OK);
    state = JSON.parse(fs.readFileSync('./pokemon_rby_nuzlocke_state.json', 'utf8'));
    logger.info('Loaded Pokemon Nuzlocke RBY game state successfully.');
} catch (e) {
    state = {
        deadPokemon: [],
        encounters: []
    };
}

var Script = function(mapper, driver) {
    var prop = mapper.properties;

    try {
        // Rule #1: Any Pokémon that faints is considered dead, and must be released.
        for (var i = 1; i <= prop.partyCount.value; i++) {
            var pokemon = prop.party['party' + i];

            // Checks if the Pokemon's health just hit zero.
            let healthIsZero = pokemon && pokemon.nickname.value != '' && pokemon.health.value == 0 && pokemon.maxHealth.value != 0;

            // Check for a dead original trainer, this is to prevent bugs where
            // players can revive Pokemon by putting them in a PC or leaving them at the daycare.
            let deadOrigTrainer = pokemon && pokemon.trainerNickname.value == 'DEAD' && pokemon.maxHealth.value != 0;

            if (healthIsZero || deadOrigTrainer) {
                logger.info(`${pokemon.nickname.value} has died.`);
                var originalMaxHealth = pokemon.maxHealth.value;

                // Change the Pokemon's HP to 0 and change their Trainer's Name to DEAD.
                driver.write_hex(pokemon.health.address, ['00', '00']);
                driver.write_hex(pokemon.maxHealth.address, ['00', '00']);
                driver.write_hex(pokemon.trainerNickname.address, ['83', '84', '80', '83', '50']);

                // Save a record of their dead Pokemon in the game state.
                state.deadPokemon.push({
                    nickname: pokemon.nickname.value,
                    species: pokemon.species.value.name,
                    health: originalMaxHealth,
                    timestamp: Date.now()
                });
                flushState();
            }
        }
    } catch (ex) {
        logger.error(ex);
    }

    try {
        // Rule #2: Do not allow capture of Pokemon past the first encounter of an area.
        var location = prop.map.loadedMap.value.area;
        var previousEncounter = state.encounters.find(x => x.location == location);
        if (location && prop.battle.isInBattle.value == 'WILD') {
            if (inWildCombat == false) {
                inWildCombat = true;
                if (previousEncounter == null) {
                    catchable = true;
                    // Save a record of their encounter in the game state.
                    state.encounters.push({
                        location: location,
                        species: prop.battle.enemy.species.value.name,
                        timestamp: Date.now()
                    });
                    flushState();
                } else {
                    catchable = false;
                    driver.write_hex(prop.battle.enemy.catchRate.address, ['00']);
                }
            }
        } else if (inWildCombat == true) {
            // A battle has just ended.
            inWildCombat = false;
        }
    } catch (ex) {
        logger.error(ex);
    }

    // Return results of the script back to the API.
    return {
        catchable: catchable,
        previousEncounter: previousEncounter
    };

};

module.exports = Script;
