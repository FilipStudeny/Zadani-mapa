import type { Entity } from "@/utils/Entities/Entity";

import { getSideBg, getImageBg, getIconPath, getSideColor } from "@/utils/functions/entityUtils";

interface EntityListItemProps {
	entity: Entity,
	isSelected: boolean,
	onClick: ()=> void,
}

export function EntityListItem({
	entity,
	isSelected,
	onClick,
}: EntityListItemProps) {
	return (
		<li
			onClick={onClick}
			className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded transition mb-1 ${
				isSelected
					? `${getSideBg(entity.side)} border-l-4 ${
						entity.side === "ally" ? "border-blue-500" : "border-red-500"
					} shadow-sm`
					: "hover:bg-gray-100"
			}`}
		>
			<div
				className={`w-8 h-8 flex items-center justify-center rounded-full ${getImageBg(
					entity.side,
					entity.active,
				)}`}
			>
				<img
					src={getIconPath(entity.type)}
					alt={entity.type}
					className={`w-5 h-5 object-contain ${
						!entity.active ? "opacity-40 grayscale" : ""
					}`}
				/>
			</div>
			<div>
				<div
					className={`font-medium ${getSideColor(entity.side)} ${
						!entity.active ? "text-gray-400 line-through" : ""
					}`}
				>
					{entity.callsign}
				</div>
				<div className="text-xs text-gray-500 capitalize">{entity.type}</div>
			</div>
		</li>
	);
}
