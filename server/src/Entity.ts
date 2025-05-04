import {broadcastTimeAndLog, computeHeading, haversineDistance, saveSnapshot, state} from "./utils";
import {io} from "./server";
import {combatManager} from "./CombatManager";

export interface Coord {
    lat: number;
    lon: number;
}

export interface Entity {
    callsign: string;
    type: 'infantry' | 'tank' | 'recon';
    side: 'ally' | 'enemy';
    lat: number;
    lon: number;
    path: Coord[];
    speed: number;
    heading: number;
    active: boolean;
    loop: boolean;
    originalPath: Coord[];
}

export function createEntity(
    callsign: string,
    type: 'infantry' | 'tank' | 'recon',
    side: 'ally' | 'enemy',
    lat: number,
    lon: number,
    path: Coord[]
): Entity {
    let speed = 2;
    if (type === 'tank') speed = 5;
    else if (type === 'recon') speed = 10;

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


export function moveEntities(): void {
    const stepTime = 1;
    saveSnapshot();

    state.simulationStepId++;
    state.simulationTime += stepTime * state.simulationSpeed;

    let activeEntities = 0;

    for (const entity of state.entities) {
        if (!entity.active) continue;

        if (entity.path.length === 0) {
            entity.active = false;
            broadcastTimeAndLog(`Unit ${entity.callsign} completed its path`);
            continue;
        }

        activeEntities++;

        const next = entity.path[0];
        const dist = haversineDistance(entity.lat, entity.lon, next.lat, next.lon);
        const maxDist = entity.speed * stepTime * state.simulationSpeed;

        if (dist <= maxDist) {
            entity.lat = next.lat;
            entity.lon = next.lon;
            entity.path.shift();
        } else {
            const ratio = maxDist / dist;
            entity.lat += (next.lat - entity.lat) * ratio;
            entity.lon += (next.lon - entity.lon) * ratio;
        }

        entity.heading = computeHeading(entity.lat, entity.lon, next.lat, next.lon);

        io.emit('entityUpdated', entity);

        for (const target of state.entities) {
            if (
                target.side !== entity.side &&
                target.active &&
                haversineDistance(entity.lat, entity.lon, target.lat, target.lon) <= 150
            ) {
                const didHit = combatManager.resolveCombat(state.simulationTime, entity, target);

                if (didHit && target.active) {
                    target.active = false;
                    io.emit('entityDestroyed', target);
                    broadcastTimeAndLog(`${entity.callsign} destroyed ${target.callsign}`);
                } else {
                    broadcastTimeAndLog(`${entity.callsign} engaged ${target.callsign} but missed`);
                }
            }
        }
    }

    if (activeEntities === 0 && state.simulationInterval) {
        clearInterval(state.simulationInterval);
        state.simulationInterval = null;
        broadcastTimeAndLog('Simulation finished — all units completed their paths.');
    } else {
        io.emit('timeUpdate', state.simulationTime);
    }
}


export function reverseStepEntities(): void {
    if (state.entityHistory.length === 0) {
        broadcastTimeAndLog("No previous state to step back to.");
        return;
    }

    state.entities = JSON.parse(JSON.stringify(state.entityHistory.pop()));
    state.simulationTime = Math.max(0, state.simulationTime - 1);
    state.simulationStepId = Math.max(0, state.simulationStepId - 1);
    combatManager.rollbackToTime(state.simulationTime);

    for (const entity of state.entities) {
        io.emit("entityUpdated", entity);
    }

    broadcastTimeAndLog("Stepped back in time.");
}