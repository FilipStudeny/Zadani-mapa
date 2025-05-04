"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntity = createEntity;
exports.moveEntities = moveEntities;
exports.reverseStepEntities = reverseStepEntities;
const utils_1 = require("./utils");
const server_1 = require("./server");
const CombatManager_1 = require("./CombatManager");
function createEntity(callsign, type, side, lat, lon, path) {
    let speed = 2;
    if (type === 'tank')
        speed = 5;
    else if (type === 'recon')
        speed = 10;
    return {
        callsign,
        type,
        side,
        lat,
        lon,
        path: [...path],
        speed,
        heading: 0,
        active: true,
        loop: true,
        originalPath: [...path],
    };
}
function moveEntities() {
    const stepTime = 1;
    (0, utils_1.saveSnapshot)();
    utils_1.state.simulationStepId++;
    utils_1.state.simulationTime += stepTime * utils_1.state.simulationSpeed;
    let activeEntities = 0;
    for (const entity of utils_1.state.entities) {
        if (!entity.active)
            continue;
        if (entity.path.length === 0) {
            entity.active = false;
            (0, utils_1.broadcastTimeAndLog)(`Unit ${entity.callsign} completed its path`);
            continue;
        }
        activeEntities++;
        const next = entity.path[0];
        const dist = (0, utils_1.haversineDistance)(entity.lat, entity.lon, next.lat, next.lon);
        const maxDist = entity.speed * stepTime * utils_1.state.simulationSpeed;
        if (dist <= maxDist) {
            entity.lat = next.lat;
            entity.lon = next.lon;
            entity.path.shift();
        }
        else {
            const ratio = maxDist / dist;
            entity.lat += (next.lat - entity.lat) * ratio;
            entity.lon += (next.lon - entity.lon) * ratio;
        }
        entity.heading = (0, utils_1.computeHeading)(entity.lat, entity.lon, next.lat, next.lon);
        server_1.io.emit('entityUpdated', entity);
        for (const target of utils_1.state.entities) {
            if (target.side !== entity.side &&
                target.active &&
                (0, utils_1.haversineDistance)(entity.lat, entity.lon, target.lat, target.lon) <= 150) {
                const didHit = CombatManager_1.combatManager.resolveCombat(utils_1.state.simulationTime, entity, target);
                if (didHit && target.active) {
                    target.active = false;
                    server_1.io.emit('entityDestroyed', target);
                    (0, utils_1.broadcastTimeAndLog)(`${entity.callsign} destroyed ${target.callsign}`);
                }
                else {
                    (0, utils_1.broadcastTimeAndLog)(`${entity.callsign} engaged ${target.callsign} but missed`);
                }
            }
        }
    }
    if (activeEntities === 0 && utils_1.state.simulationInterval) {
        clearInterval(utils_1.state.simulationInterval);
        utils_1.state.simulationInterval = null;
        (0, utils_1.broadcastTimeAndLog)('Simulation finished — all units completed their paths.');
    }
    else {
        server_1.io.emit('timeUpdate', utils_1.state.simulationTime);
    }
}
function reverseStepEntities() {
    if (utils_1.state.entityHistory.length === 0) {
        (0, utils_1.broadcastTimeAndLog)("No previous state to step back to.");
        return;
    }
    utils_1.state.entities = JSON.parse(JSON.stringify(utils_1.state.entityHistory.pop()));
    utils_1.state.simulationTime = Math.max(0, utils_1.state.simulationTime - 1);
    utils_1.state.simulationStepId = Math.max(0, utils_1.state.simulationStepId - 1);
    CombatManager_1.combatManager.rollbackToTime(utils_1.state.simulationTime);
    for (const entity of utils_1.state.entities) {
        server_1.io.emit("entityUpdated", entity);
    }
    (0, utils_1.broadcastTimeAndLog)("Stepped back in time.");
}
