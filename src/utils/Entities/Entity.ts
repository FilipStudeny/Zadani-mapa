export interface Entity {
	callsign: string,
	type: string,
	lat: number,
	lon: number,
	path: { lat: number, lon: number }[],
	active: boolean,
	speed?: number,
	heading?: number,
	loop?: boolean,
	ammo?: number,
	health?: number,
}
