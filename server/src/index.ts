import cors from 'cors';
import {paths} from "./Paths";
import {Coord, createEntity, moveEntities, reverseStepEntities} from "./Entity";
import {broadcastTimeAndLog, state} from "./utils";
import {app, io, server} from "./server";
import {combatManager} from "./CombatManager";

app.use(cors());

if (state.entities.length === 0) {
    state.entities.push(createEntity('Alpha1', 'infantry', 'ally', 49.634, 17.522, paths.Alpha));
    state.entities.push(createEntity('Bravo2', 'tank', 'ally', 49.636, 17.528, paths.Bravo));
    state.entities.push(createEntity('Charlie3', 'infantry', 'ally', 49.632, 17.525, paths.Charlie));
    state.entities.push(createEntity('Delta4', 'recon', 'ally', 49.630, 17.526, paths.Delta));
    state.entities.push(createEntity('Echo5', 'recon', 'ally', 49.633, 17.524, paths.Alpha));
    state.entities.push(createEntity('Xray1', 'infantry', 'enemy', 49.638, 17.530, paths.Enemy1));
    state.entities.push(createEntity('Zulu2', 'tank', 'enemy', 49.639, 17.529, paths.Enemy2));
    state.entities.push(createEntity('Yankee3', 'recon', 'enemy', 49.640, 17.528, paths.Enemy3));
}

io.on('connection', (socket) => {
    console.log('Client connected');

    for (const entity of state.entities) {
        socket.emit('entityCreated', entity);
    }

    socket.emit('timeUpdate', state.simulationTime);

    socket.on('updateRoute', ({ callsign, path }: { callsign: string; path: Coord[] }) => {
        const entity = state.entities.find(e => e.callsign === callsign);
        if (!entity) return;
        entity.path = [...path];
        entity.originalPath = [...path];
        entity.active = true;
        broadcastTimeAndLog(`Route updated for ${entity.callsign}`);
    });

    socket.on('control', (cmd: string) => {
        switch (cmd) {
            case 'play':
                if (!state.simulationInterval) {
                    state.simulationInterval = setInterval(moveEntities, 1000);
                    broadcastTimeAndLog('Simulation started');
                }
                break;
            case 'pause':
                if (state.simulationInterval) {
                    clearInterval(state.simulationInterval);
                    state.simulationInterval = null;
                    broadcastTimeAndLog('Simulation paused');
                }
                break;
            case 'step':
                moveEntities();
                broadcastTimeAndLog('Simulation step');
                break;
            case 'reverse':
                reverseStepEntities();
                break;
            case 'stop':
                if (state.simulationInterval) {
                    clearInterval(state.simulationInterval);
                    state.simulationInterval = null;
                    broadcastTimeAndLog('Simulation stopped');
                }
                break;
            default:
                broadcastTimeAndLog(`Unknown command: ${cmd}`);
        }
    });

    socket.on('setSpeed', (speedFactor: number) => {
        state.simulationSpeed = Math.max(0.1, speedFactor);
        broadcastTimeAndLog(`Simulation speed set to ${state.simulationSpeed}×`);
    });

    socket.on('reset', () => {
        state.simulationTime = 0;
        state.simulationStepId = 0;
        state.entityHistory = [];
        combatManager.clear();

        for (const entity of state.entities) {
            entity.lat = entity.originalPath[0].lat;
            entity.lon = entity.originalPath[0].lon;
            entity.path = [...entity.originalPath];
            entity.active = true;
            entity.heading = 0;
        }

        for (const entity of state.entities) {
            io.emit('entityUpdated', entity);
        }

        broadcastTimeAndLog('Simulation reset');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(9999, () => {
    console.log('Simulation backend running on ws://localhost:9999');
});
