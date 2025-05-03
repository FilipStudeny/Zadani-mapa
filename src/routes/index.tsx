import { createFileRoute } from "@tanstack/react-router";
import { Mosaic, MosaicWindow } from "react-mosaic-component";
import "react-mosaic-component/react-mosaic-component.css";
import { Map, View } from "ol";
import { Feature } from "ol";
import { defaults as defaultControls } from "ol/control";
import { boundingExtent } from "ol/extent";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { getDistance } from "ol/sphere";
import { Style, Stroke } from "ol/style";
import Icon from "ol/style/Icon";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

import type { Geometry } from "ol/geom";

export const Route = createFileRoute("/")({
	component: App,
});

interface Entity {
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

type PanelId = "map" | "controls" | "entities" | "unitInfo" | "log";

const initialLayout = {
	direction: "row",
	first: "map",
	second: {
		direction: "column",
		first: "controls",
		second: {
			direction: "column",
			first: "entities",
			second: {
				direction: "column",
				first: "unitInfo",
				second: "log",
			},
		},
	},
} as const;

function App() {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapObj = useRef<Map | null>(null);
	const entitySource = useRef(new VectorSource<Feature<Geometry>>());
	const pathSource = useRef(new VectorSource<Feature<Geometry>>());
	const entityLayer = useRef(new VectorLayer({ source: entitySource.current }));
	const pathLayer = useRef(new VectorLayer({ source: pathSource.current }));

	const [log, setLog] = useState<string[]>(["[00:00:00] Sim start"]);
	const [selectedUnit, setSelectedUnit] = useState<Entity | null>(null);
	const socketRef = useRef<ReturnType<typeof io> | null>(null);
	const [entities, setEntities] = useState<Entity[]>([]);
	const [simSpeed, setSimSpeed] = useState<number>(1);

	const [showDistanceModal, setShowDistanceModal] = useState(false); 
	const [selectedForDistance, setSelectedForDistance] = useState<Entity[]>([]);

	useEffect(() => {
		if (!mapRef.current) return;

		const map = new Map({
			target: mapRef.current,
			layers: [
				new TileLayer({ source: new OSM() }),
				pathLayer.current,
				entityLayer.current,
			],
			view: new View({ center: fromLonLat([17.522, 49.634]), zoom: 14 }),
			controls: defaultControls({ attribution: false, zoom: false }),
		});

		mapObj.current = map;

		map.on("click", (evt) => {
			map.forEachFeatureAtPixel(evt.pixel, (feature) => {
				const entity = feature.get("entity") as Entity;
				if (entity) {
					setSelectedUnit(entity);
					drawPath(entity);
					logMsg(`Entity ${entity.callsign} selected`);
				}
			});
		});

		const socket = io("ws://localhost:9999");
		socketRef.current = socket;

		socket.on("entityCreated", (entity: Entity) => {
			setEntities((prev) => {
				if (prev.some((e) => e.callsign === entity.callsign)) return prev;

				const exists = entitySource.current.getFeatures().some((f) => f.get("entity")?.callsign === entity.callsign);
				if (!exists) {
					const feature = createFeature(entity);
					entitySource.current.addFeature(feature);
					fitMapToEntities();
				}

				return [...prev, entity];
			});
		});

		socket.on("entityUpdated", ({ callsign, lat, lon, heading }) => {
			const feature = entitySource.current.getFeatures().find((f) => f.get("entity")?.callsign === callsign);
			if (feature) {
				const geom = feature.getGeometry();
				if (geom && geom instanceof Point) {
					geom.setCoordinates(fromLonLat([lon, lat]));
				}

				const e = feature.get("entity") as Entity;
				if (e) {
					e.lat = lat;
					e.lon = lon;
					e.heading = heading;
					feature.set("entity", e);
					feature.setStyle(createFeature(e).getStyle());
				}
			}

			setEntities((prev) => prev.map((e) => (e.callsign === callsign ? { ...e, lat, lon, heading } : e)));
			if (selectedUnit?.callsign === callsign) {
				setSelectedUnit((prev) => (prev ? { ...prev, lat, lon, heading } : null));
			}
		});

		socket.on("log", (msg: string) => logMsg(msg));

		return () => {
			socket.disconnect();
			map.setTarget(undefined);
		};
	}, []);

	const createFeature = (entity: Entity): Feature<Geometry> => {
		const feature = new Feature({
			geometry: new Point(fromLonLat([entity.lon, entity.lat])),
		});
		feature.set("entity", entity);

		let iconPath = "/images/default.png";
		if (entity.type === "infantry") iconPath = "/images/infantry.png";
		else if (entity.type === "tank" || entity.type === "armour") iconPath = "/images/armour.png";

		feature.setStyle(new Style({
			image: new Icon({
				src: iconPath,
				scale: 0.05,
				rotation: ((entity.heading ?? 0) * Math.PI) / 180,
				anchor: [0.5, 0.5],
				anchorXUnits: "fraction",
				anchorYUnits: "fraction",
			}),
		}));

		return feature;
	};

	const drawPath = (entity: Entity) => {
		pathSource.current.clear();
		if (entity.path.length === 0) return;
		const coords = entity.path.map((p) => fromLonLat([p.lon, p.lat]));
		const feature = new Feature({ geometry: new LineString(coords) });
		feature.setStyle(new Style({ stroke: new Stroke({ color: "#ff0000", width: 2 }) }));
		pathSource.current.addFeature(feature);
	};

	const drawDistanceLine = (a: Entity, b: Entity) => {
		pathSource.current.clear();
		const coords = [
			fromLonLat([a.lon, a.lat]),
			fromLonLat([b.lon, b.lat]),
		];
		const feature = new Feature({ geometry: new LineString(coords) });
		feature.setStyle(new Style({ stroke: new Stroke({ color: "#0000ff", width: 3, lineDash: [8, 4] }) }));
		pathSource.current.addFeature(feature);
	};

	const fitMapToEntities = () => {
		const features = entitySource.current.getFeatures();
		if (!mapObj.current || features.length === 0) return;
		const extent = boundingExtent(features.map((f) => (f.getGeometry() as Point).getCoordinates()));
		mapObj.current.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 17 });
	};

	const logMsg = (msg: string) => {
		setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
	};

	const handleSimControl = (action: string) => {
		socketRef.current?.emit("control", action.toLowerCase());
	};

	const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const speed = parseFloat(e.target.value);
		setSimSpeed(speed);
		socketRef.current?.emit("setSpeed", speed);
	};

	const handleReset = () => {
		setLog([`[${new Date().toLocaleTimeString()}] Simulation reset`]);
		socketRef.current?.emit("reset");
	};

	const renderPanel = (id: PanelId) => {
		switch (id) {
			case "map":
				return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
			case "controls":
				return (
					<div>
						<div>
							<button onClick={() => handleSimControl("Step")}>⏩</button>
							<button onClick={() => handleSimControl("Play")}>▶️</button>
							<button onClick={() => handleSimControl("Pause")}>⏸️</button>
							<button onClick={() => handleSimControl("Stop")}>⏹️</button>
							<button onClick={handleReset}>🔄 Reset</button>
							<button onClick={() => setShowDistanceModal(true)}>📏 Measure</button> {/* ✅ */}
						</div>
						<div>
							<label>Speed: {simSpeed.toFixed(1)}×</label>
							<input type="range" min="0.1" max="10" step="0.1" value={simSpeed} onChange={handleSpeedChange} />
						</div>
					</div>
				);
			case "entities":
				return (
					<ul>
						{entities.map((e) => (
							<li key={e.callsign} onClick={() => {
								setSelectedUnit(e);
								drawPath(e);
								logMsg(`Entity ${e.callsign} selected`);
							}}>
								{e.callsign} ({e.type})
							</li>
						))}
					</ul>
				);
			case "unitInfo":
				return selectedUnit ? (
					<div>
						<p>Callsign: {selectedUnit.callsign}</p>
						<p>Type: {selectedUnit.type}</p>
						<p>Pos: {selectedUnit.lat.toFixed(5)}N, {selectedUnit.lon.toFixed(5)}E</p>
						<p>Heading: {selectedUnit.heading ?? "–"}°</p>
						<p>Speed: {selectedUnit.speed ?? "–"} m/s</p>
						<p>Ammo: {selectedUnit.ammo ?? "–"}</p>
						<p>Health: {selectedUnit.health ?? "–"}%</p>
					</div>
				) : <p>No unit selected</p>;
			case "log":
				return <pre>{log.map((l, i) => <div key={i}>{l}</div>)}</pre>;
		}
	};

	return (
		<div style={{ height: "100vh", width: "100vw" }}>
			<Mosaic<PanelId>
				renderTile={(id, path) => (
					<MosaicWindow<PanelId> path={path} title={id.toUpperCase()}>
						{renderPanel(id)}
					</MosaicWindow>
				)}
				initialValue={initialLayout}
			/>

			{/* ✅ Modal */}
			{showDistanceModal && (
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
								const selected = selectedForDistance.includes(e);

								return (
									<li key={e.callsign} style={{
										listStyle: "none",
										padding: "6px",
										backgroundColor: selected ? "#def" : "transparent",
										marginBottom: "4px",
										borderRadius: "6px",
										cursor: "pointer",
									}} onClick={() => {
										setSelectedForDistance((prev) => {
											if (prev.includes(e)) {
												const newSelection = prev.filter(x => x !== e);
												pathSource.current.clear();

												return newSelection;
											}

											if (prev.length < 2) {
												const newSelection = [...prev, e];
												if (newSelection.length === 2) {
													drawDistanceLine(newSelection[0], newSelection[1]);
												}

												return newSelection;
											}

											return prev;
										});
									}}>
										{e.callsign} ({e.type})
										{selected && <strong style={{ marginLeft: 8 }}>[✓]</strong>}
									</li>
								);
							})}
						</ul>

						{selectedForDistance.length === 2 && (
							<div style={{ marginTop: "1rem" }}>
								<p>
									📐 Vzdálenost:{" "}
									<strong>
										{getDistance(
											[selectedForDistance[0].lon, selectedForDistance[0].lat],
											[selectedForDistance[1].lon, selectedForDistance[1].lat],
										).toFixed(2)}{" "}
										metrů
									</strong>
								</p>
							</div>
						)}

						<div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
							<button onClick={() => {
								setSelectedForDistance([]);
								setShowDistanceModal(false);
								pathSource.current.clear();
							}}>Zavřít</button>
						</div>
					</div>
				</div>
			)}

		</div>
	);
}
