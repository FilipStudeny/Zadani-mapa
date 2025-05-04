import {Entity} from "./Entity";
import { io } from "./server";

export function computeHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const state = {
    entities: [] as Entity[],
    entityHistory: [] as Entity[][],
    simulationTime: 0,
    simulationStepId: 0,
    simulationInterval: null as NodeJS.Timeout | null,
    simulationSpeed: 1,
};

export function saveSnapshot() {
    state.entityHistory.push(JSON.parse(JSON.stringify(state.entities)));
    if (state.entityHistory.length > 1000) state.entityHistory.shift();
}

export function broadcastTimeAndLog(msg: string) {
    io.emit('log', { msg, time: state.simulationTime });
    io.emit('timeUpdate', state.simulationTime);
}