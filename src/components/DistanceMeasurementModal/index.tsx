import { Feature } from "ol";
import LineString from "ol/geom/LineString";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { getDistance } from "ol/sphere";
import { Style, Stroke } from "ol/style";

import type { Entity } from "@/utils/Entities/Entity";

interface DistanceMeasurementModalProps {
	entities: Entity[],
	selected: Entity[],
	setSelected: (selected: Entity[])=> void,
	onClose: ()=> void,
	pathSource: React.MutableRefObject<VectorSource<Feature> | null>,
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
		const coords = [
			fromLonLat([a.lon, a.lat]),
			fromLonLat([b.lon, b.lat]),
		];
		const feature = new Feature({ geometry: new LineString(coords) });
		feature.setStyle(new Style({ stroke: new Stroke({ color: "#0000ff", width: 3, lineDash: [8, 4] }) }));
		pathSource.current?.addFeature(feature);
	};

	const handleSelect = (e: Entity) => {
		setSelected((prev) => {
			if (prev.includes(e)) {
				pathSource.current?.clear();

				return prev.filter(x => x !== e);
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
		<div style={{
			position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
			backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
			zIndex: 9999,
		}}>
			<div style={{
				background: "white", padding: "2rem", borderRadius: "1rem", maxWidth: "500px", width: "100%",
			}}>
				<h2>📏 Měření vzdálenosti</h2>
				<p>Vyber dvě entity pro změření vzdálenosti mezi nimi:</p>
				<ul style={{ maxHeight: "200px", overflowY: "auto", padding: 0 }}>
					{entities.map((e) => {
						const isSelected = selected.includes(e);

						return (
							<li key={e.callsign} style={{
								listStyle: "none",
								padding: "6px",
								backgroundColor: isSelected ? "#def" : "transparent",
								marginBottom: "4px",
								borderRadius: "6px",
								cursor: "pointer",
							}} onClick={() => handleSelect(e)}>
								{e.callsign} ({e.type})
								{isSelected && <strong style={{ marginLeft: 8 }}>[✓]</strong>}
							</li>
						);
					})}
				</ul>

				{selected.length === 2 && (
					<div style={{ marginTop: "1rem" }}>
						<p>
							📐 Vzdálenost:{" "}
							<strong>
								{getDistance(
									[selected[0].lon, selected[0].lat],
									[selected[1].lon, selected[1].lat],
								).toFixed(2)}{" "}
								metrů
							</strong>
						</p>
					</div>
				)}

				<div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
					<button onClick={() => {
						setSelected([]);
						pathSource.current?.clear();
						onClose();
					}}>Zavřít</button>
				</div>
			</div>
		</div>
	);
}
