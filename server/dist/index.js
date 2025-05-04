"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// === simulation/index.ts ===
const cors_1 = __importDefault(require("cors"));
const Paths_1 = require("./Paths");
const Entity_1 = require("./Entity");
const utils_1 = require("./utils");
const server_1 = require("./server");
const CombatManager_1 = require("./CombatManager");
server_1.app.use((0, cors_1.default)());
if (utils_1.state.entities.length === 0) {
    utils_1.state.entities.push((0, Entity_1.createEntity)('Alpha1', 'infantry', 'ally', 49.634, 17.522, Paths_1.paths.Alpha));
    utils_1.state.entities.push((0, Entity_1.createEntity)('Bravo2', 'tank', 'ally', 49.636, 17.528, Paths_1.paths.Bravo));
    utils_1.state.entities.push((0, Entity_1.createEntity)('Charlie3', 'infantry', 'ally', 49.632, 17.525, Paths_1.paths.Charlie));
    utils_1.state.entities.push((0, Entity_1.createEntity)('Delta4', 'recon', 'ally', 49.630, 17.526, Paths_1.paths.Delta));
    utils_1.state.entities.push((0, Entity_1.createEntity)('Echo5', 'recon', 'ally', 49.633, 17.524, Paths_1.paths.Alpha));
    utils_1.state.entities.push((0, Entity_1.createEntity)('Xray1', 'infantry', 'enemy', 49.638, 17.530, Paths_1.paths.Enemy1));
    utils_1.state.entities.push((0, Entity_1.createEntity)('Zulu2', 'tank', 'enemy', 49.639, 17.529, Paths_1.paths.Enemy2));
    utils_1.state.entities.push((0, Entity_1.createEntity)('Yankee3', 'recon', 'enemy', 49.640, 17.528, Paths_1.paths.Enemy3));
}
server_1.io.on('connection', (socket) => {
    console.log('Client connected');
    for (const entity of utils_1.state.entities) {
        socket.emit('entityCreated', entity);
    }
    socket.emit('timeUpdate', utils_1.state.simulationTime);
    socket.on('updateRoute', ({ callsign, path }) => {
        const entity = utils_1.state.entities.find(e => e.callsign === callsign);
        if (!entity)
            return;
        entity.path = [...path];
        entity.originalPath = [...path];
        entity.active = true;
        (0, utils_1.broadcastTimeAndLog)(`Route updated for ${entity.callsign}`);
    });
    socket.on('control', (cmd) => {
        switch (cmd) {
            case 'play':
                if (!utils_1.state.simulationInterval) {
                    utils_1.state.simulationInterval = setInterval(Entity_1.moveEntities, 1000);
                    (0, utils_1.broadcastTimeAndLog)('Simulation started');
                }
                break;
            case 'pause':
                if (utils_1.state.simulationInterval) {
                    clearInterval(utils_1.state.simulationInterval);
                    utils_1.state.simulationInterval = null;
                    (0, utils_1.broadcastTimeAndLog)('Simulation paused');
                }
                break;
            case 'step':
                (0, Entity_1.moveEntities)();
                (0, utils_1.broadcastTimeAndLog)('Simulation step');
                break;
            case 'reverse':
                (0, Entity_1.reverseStepEntities)();
                break;
            case 'stop':
                if (utils_1.state.simulationInterval) {
                    clearInterval(utils_1.state.simulationInterval);
                    utils_1.state.simulationInterval = null;
                    (0, utils_1.broadcastTimeAndLog)('Simulation stopped');
                }
                break;
            default:
                (0, utils_1.broadcastTimeAndLog)(`Unknown command: ${cmd}`);
        }
    });
    socket.on('setSpeed', (speedFactor) => {
        utils_1.state.simulationSpeed = Math.max(0.1, speedFactor);
        (0, utils_1.broadcastTimeAndLog)(`Simulation speed set to ${utils_1.state.simulationSpeed}×`);
    });
    socket.on('reset', () => {
        utils_1.state.simulationTime = 0;
        utils_1.state.simulationStepId = 0;
        utils_1.state.entityHistory = [];
        CombatManager_1.combatManager.clear();
        for (const entity of utils_1.state.entities) {
            entity.lat = entity.originalPath[0].lat;
            entity.lon = entity.originalPath[0].lon;
            entity.path = [...entity.originalPath];
            entity.active = true;
            entity.heading = 0;
        }
        for (const entity of utils_1.state.entities) {
            server_1.io.emit('entityUpdated', entity);
        }
        (0, utils_1.broadcastTimeAndLog)('Simulation reset');
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
server_1.server.listen(9999, () => {
    console.log('Simulation backend running on ws://localhost:9999');
});
