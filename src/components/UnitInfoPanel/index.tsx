import type { Entity } from "@/utils/Entities/Entity";

interface UnitInfoPanelProps {
	selectedUnit: Entity | null,
}

const getIconPath = (type: string) => {
	switch (type) {
		case "infantry":
			return "/images/infantry.png";
		case "tank":
		case "armour":
			return "/images/armour.png";
		default:
			return "/images/default.png";
	}
};

export function UnitInfoPanel({ selectedUnit }: UnitInfoPanelProps) {
	if (!selectedUnit) {
		return (
			<div className="text-center text-gray-500 italic p-4">
				No unit selected
			</div>
		);
	}

	const iconPath = getIconPath(selectedUnit.type);

	return (
		<div className="p-4 rounded shadow-sm bg-white text-sm space-y-3">
			<div className="flex items-center gap-3">
				<img
					src={iconPath}
					alt={`${selectedUnit.type} icon`}
					className="w-12 h-12 object-contain"
				/>
				<div>
					<h2 className="text-lg font-semibold">{selectedUnit.callsign}</h2>
					<p className="text-gray-500 capitalize">{selectedUnit.type}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 pt-2">
				<div>
					<span className="text-gray-500">Latitude:</span>
					<div>{selectedUnit.lat.toFixed(5)}°N</div>
				</div>
				<div>
					<span className="text-gray-500">Longitude:</span>
					<div>{selectedUnit.lon.toFixed(5)}°E</div>
				</div>
				<div>
					<span className="text-gray-500">Heading:</span>
					<div>{selectedUnit.heading ?? "–"}°</div>
				</div>
				<div>
					<span className="text-gray-500">Speed:</span>
					<div>{selectedUnit.speed ?? "–"} m/s</div>
				</div>
				<div>
					<span className="text-gray-500">Ammo:</span>
					<div>{selectedUnit.ammo ?? "–"}</div>
				</div>
				<div>
					<span className="text-gray-500">Health:</span>
					<div>{selectedUnit.health ?? "–"}%</div>
				</div>
			</div>
		</div>
	);
}
