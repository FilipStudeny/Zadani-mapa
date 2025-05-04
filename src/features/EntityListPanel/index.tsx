import type { Entity } from "@/utils/Entities/Entity";

import { EntityListItem } from "@/components/EntityListItem";

interface EntityListPanelProps {
	entities: Entity[],
	onSelect: (entity: Entity)=> void,
	selectedEntity: Entity | null,
}

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
		<div className="flex flex-col h-full">
			<ul className="flex-1 overflow-y-auto divide-y divide-gray-200">
				{entities.map((entity) => (
					<EntityListItem
						key={entity.callsign}
						entity={entity}
						isSelected={selectedEntity?.callsign === entity.callsign}
						onClick={() => onSelect(entity)}
					/>
				))}
			</ul>
		</div>
	);
}
