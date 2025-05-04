"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combatManager = exports.CombatManager = void 0;
const HIT_CHANCE = 0.5;
class CombatManager {
    constructor(hitChance = HIT_CHANCE) {
        this.combatLog = new Map();
        this.hitChance = hitChance;
    }
    /**
     * Creates a unique key to identify a combat event.
     */
    generateKey(time, attacker, target) {
        return `${time.toFixed(2)}-${attacker}->${target}`;
    }
    /**
     * Resolves combat between two entities and returns whether the target was hit.
     */
    resolveCombat(time, attacker, target) {
        const key = this.generateKey(time, attacker.callsign, target.callsign);
        if (!this.combatLog.has(key)) {
            const hit = Math.random() < this.hitChance;
            this.combatLog.set(key, hit);
        }
        return this.combatLog.get(key);
    }
    /**
     * Rolls back combat results beyond a given simulation time.
     */
    rollbackToTime(time) {
        for (const key of Array.from(this.combatLog.keys())) {
            const [t] = key.split('-');
            if (parseFloat(t) > time) {
                this.combatLog.delete(key);
            }
        }
    }
    clear() {
        this.combatLog.clear();
    }
}
exports.CombatManager = CombatManager;
exports.combatManager = new CombatManager();
