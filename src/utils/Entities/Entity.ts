export type EntityType = "infantry" | "tank" | "recon";
export type EntitySide = "ally" | "enemy";

export interface Coord {
	lat: number,
	lon: number,
}

export interface Entity {
	callsign: string,
	type: EntityType,
	side: EntitySide,

	lat: number,
	lon: number,
	path: Coord[],

	active: boolean,
	loop: boolean,

	speed: number,
	heading: number,
	ammo: number,
	health: number,
}
