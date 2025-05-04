import type { Entity } from "@/utils/Entities/Entity";

import { getImageBg, getIconPath } from "@/utils/functions/entityUtils";

interface UnitInfoPanelProps {
	selectedUnit: Entity | null,
}

export function UnitInfoPanel({ selectedUnit }: UnitInfoPanelProps) {
	if (!selectedUnit) {
		return (
			<div className="text-center text-gray-500 italic p-4">
				No unit selected
			</div>
		);
	}

	return (
		<div className="p-4 rounded shadow-sm bg-white text-sm space-y-3">
			<div className="flex items-center gap-3">
				<div
					className={`w-14 h-14 flex items-center justify-center rounded-full ${getImageBg(
						selectedUnit.side,
						selectedUnit.active,
					)}`}
				>
					<img
						src={getIconPath(selectedUnit.type)}
						alt={`${selectedUnit.type} icon`}
						className={`w-8 h-8 object-contain ${
							!selectedUnit.active ? "opacity-50 grayscale" : ""
						}`}
					/>
				</div>
				<div>
					<h2
						className={`text-lg font-semibold ${
							!selectedUnit.active ? "text-gray-400 line-through" : ""
						}`}
					>
						{selectedUnit.callsign}
					</h2>
					<p className="text-gray-500 capitalize">{selectedUnit.type}</p>
					{!selectedUnit.active && (
						<span className="text-xs text-red-500 font-bold uppercase">Destroyed</span>
					)}
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
