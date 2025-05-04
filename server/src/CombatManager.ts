import {Entity} from "./Entity";

const HIT_CHANCE = 0.5;
type CombatKey = string;

export class CombatManager {
    private combatLog = new Map<CombatKey, boolean>();
    private hitChance: number;

    constructor(hitChance = HIT_CHANCE) {
        this.hitChance = hitChance;
    }

    /**
     * Creates a unique key to identify a combat event.
     */
    private generateKey(time: number, attacker: string, target: string): CombatKey {
        return `${time.toFixed(2)}-${attacker}->${target}`;
    }

    /**
     * Resolves combat between two entities and returns whether the target was hit.
     */
    resolveCombat(time: number, attacker: Entity, target: Entity): boolean {
        const key = this.generateKey(time, attacker.callsign, target.callsign);

        if (!this.combatLog.has(key)) {
            const hit = Math.random() < this.hitChance;
            this.combatLog.set(key, hit);
        }

        return this.combatLog.get(key)!;
    }

    /**
     * Rolls back combat results beyond a given simulation time.
     */
    rollbackToTime(time: number): void {
        for (const key of Array.from(this.combatLog.keys())) {
            const [t] = key.split('-');
            if (parseFloat(t) > time) {
                this.combatLog.delete(key);
            }
        }
    }

    clear(): void {
        this.combatLog.clear();
    }
}

export const combatManager = new CombatManager();
