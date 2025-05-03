import type { Entity } from "@/utils/Entities/Entity";

interface EntityListPanelProps {
	entities: Entity[],
	onSelect: (entity: Entity)=> void,
	selectedEntity: Entity | null,
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

export function EntityListPanel({
	entities,
	onSelect,
	selectedEntity,
}: EntityListPanelProps) {
	if (entities.length === 0) {
		return (
			<div className="text-center text-gray-500 italic p-4">
				No entities available
			</div>
		);
	}

	return (
		<ul className="divide-y divide-gray-200">
			{entities.map((entity) => {
				const isSelected = selectedEntity?.callsign === entity.callsign;

				return (
					<li
						key={entity.callsign}
						onClick={() => onSelect(entity)}
						className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded transition 
							${isSelected
						? "bg-blue-100 border-l-4 border-blue-500 shadow-sm"
						: "hover:bg-gray-100"}`}
					>
						<img
							src={getIconPath(entity.type)}
							alt={entity.type}
							className="w-6 h-6 object-contain"
						/>
						<div>
							<div className={`font-medium ${isSelected ? "text-blue-800" : ""}`}>
								{entity.callsign}
							</div>
							<div className="text-xs text-gray-500 capitalize">
								{entity.type}
							</div>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
