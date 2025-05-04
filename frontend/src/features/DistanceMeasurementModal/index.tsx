import { Move3D } from "lucide-react";
import { Feature } from "ol";
import LineString from "ol/geom/LineString";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { getDistance } from "ol/sphere";
import { Style, Stroke } from "ol/style";

import type { Entity } from "@/utils/Entities/Entity";

import { ControlButton } from "@/components/Buttons/ControlButton";
import { EntityListItem } from "@/components/EntityListItem";

interface DistanceMeasurementModalProps {
	entities: Entity[],
	selected: Entity[],
	setSelected: (selected: Entity[])=> void,
	onClose: ()=> void,
	pathSource: React.MutableRefObject<VectorSource<Feature> | null>,
}

function DistanceHeader() {
	return (
		<div className="flex items-center gap-2 mb-2">
			<Move3D size={20} className="text-blue-600" />
			<h2 className="text-lg font-semibold">Měření vzdálenosti</h2>
		</div>
	);
}

function DistanceDisplay({ a, b }: { a: Entity, b: Entity }) {
	const distance = getDistance([a.lon, a.lat], [b.lon, b.lat]);

	return (
		<p className="flex items-center gap-1 text-sm">
			<Move3D size={16} className="text-blue-600" />
			Vzdálenost: <strong>{distance.toFixed(2)} metrů</strong>
		</p>
	);
}

export function DistanceMeasurementModal({
	entities,
	selected,
	setSelected,
	onClose,
	pathSource,
}: DistanceMeasurementModalProps) {
	const drawDistanceLine = (a: Entity, b: Entity) => {
		pathSource.current?.clear();
		const coords = [fromLonLat([a.lon, a.lat]), fromLonLat([b.lon, b.lat])];
		const feature = new Feature({ geometry: new LineString(coords) });
		feature.setStyle(
			new Style({
				stroke: new Stroke({ color: "#0000ff", width: 3, lineDash: [8, 4] }),
			}),
		);
		pathSource.current?.addFeature(feature);
	};

	const handleSelect = (e: Entity) => {
		setSelected((prev) => {
			if (prev.includes(e)) {
				pathSource.current?.clear();

				return prev.filter((x) => x !== e);
			}

			if (prev.length < 2) {
				const newSel = [...prev, e];
				if (newSel.length === 2) drawDistanceLine(newSel[0], newSel[1]);

				return newSel;
			}

			return prev;
		});
	};

	return (
		<div className="absolute top-0 right-0 z-40 w-[360px] h-screen bg-white shadow-xl rounded-l-lg p-5 flex flex-col overflow-y-auto">
			<DistanceHeader />

			<p className="text-sm text-gray-600 mb-3">
				Vyber dvě entity pro změření vzdálenosti mezi nimi:
			</p>

			<ul className="divide-y divide-gray-200 mb-4 flex-1 overflow-y-auto">
				{entities.map((entity) => (
					<EntityListItem
						key={entity.callsign}
						entity={entity}
						isSelected={selected.includes(entity)}
						onClick={() => handleSelect(entity)}
					/>
				))}
			</ul>

			{selected.length === 2 && (
				<div className="mt-2">
					<DistanceDisplay a={selected[0]} b={selected[1]} />
				</div>
			)}

			<div className="mt-4">
				<ControlButton
					icon={<span>Zavřít</span>}
					onClick={() => {
						setSelected([]);
						pathSource.current?.clear();
						onClose();
					}}
					title="Zavřít"
				/>
			</div>
		</div>
	);
}
