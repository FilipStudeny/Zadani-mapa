"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = void 0;
exports.computeHeading = computeHeading;
exports.haversineDistance = haversineDistance;
exports.saveSnapshot = saveSnapshot;
exports.broadcastTimeAndLog = broadcastTimeAndLog;
const server_1 = require("./server");
function computeHeading(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
    const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
exports.state = {
    entities: [],
    entityHistory: [],
    simulationTime: 0,
    simulationStepId: 0,
    simulationInterval: null,
    simulationSpeed: 1,
};
function saveSnapshot() {
    exports.state.entityHistory.push(JSON.parse(JSON.stringify(exports.state.entities)));
    if (exports.state.entityHistory.length > 1000)
        exports.state.entityHistory.shift();
}
function broadcastTimeAndLog(msg) {
    server_1.io.emit('log', { msg, time: exports.state.simulationTime });
    server_1.io.emit('timeUpdate', exports.state.simulationTime);
}
