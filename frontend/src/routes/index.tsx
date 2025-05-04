import { createFileRoute } from "@tanstack/react-router";
import {
	MapIcon,
	SlidersHorizontal,
	List,
	Crosshair,
	ScrollText,
} from "lucide-react";
import { Map } from "ol";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useEffect, useRef, useState, type JSX } from "react";
import { Mosaic, MosaicWindow } from "react-mosaic-component";

import type { Entity } from "@/utils/Entities/Entity";
import type { PanelId } from "@/utils/Entities/PanelId";
import type { Geometry } from "ol/geom";

import { ControlPanel } from "@/features/ControlPanel";
import { DistanceMeasurementModal } from "@/features/DistanceMeasurementModal";
import { EntityListPanel } from "@/features/EntityListPanel";
import { LogPanel } from "@/features/LogPanel";
import { SimulationMap } from "@/features/SimulationMap";
import { UnitInfoPanel } from "@/features/UnitInfoPanel";
import { useSimulationSocket } from "@/hooks/useSimulationSocket";
import { drawEntityPath } from "@/utils/functions/mapUtils";

import "react-mosaic-component/react-mosaic-component.css";

export const Route = createFileRoute("/")({ component: App });

const initialLayout = {
	direction: "column",
	splitPercentage: 80,
	first: {
		direction: "row",
		first: "map",
		second: {
			direction: "column",
			splitPercentage: 20,
			first: "controls",
			second: {
				direction: "row",
				splitPercentage: 60,
				first: "entities",
				second: "unitInfo",
			},
		},
	},
	second: "log",
} as const;

const panelTitles: Record<PanelId, { icon: JSX.Element, label: string }> = {
	map: { icon: <MapIcon size={16} />, label: "Map" },
	controls: { icon: <SlidersHorizontal size={16} />, label: "Controls" },
	entities: { icon: <List size={16} />, label: "Entities" },
	unitInfo: { icon: <Crosshair size={16} />, label: "Unit Info" },
	log: { icon: <ScrollText size={16} />, label: "Log" },
};

function SimulationConnectionStatus({ isConnected }: { isConnected: boolean }) {
	if (isConnected) return null;

	return (
		<div className="h-screen flex items-center justify-center flex-col bg-slate-900 text-slate-200 font-sans">
			<div className="w-16 h-16 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin mb-4" />
			<div className="text-xl font-medium">Connecting to simulation server...</div>
		</div>
	);
}

function App() {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapObj = useRef<Map | null>(null);
	const entitySource = useRef(new VectorSource<Feature<Geometry>>());
	const pathSource = useRef(new VectorSource<Feature<Geometry>>());
	const entityLayer = useRef(new VectorLayer({ source: entitySource.current }));
	const pathLayer = useRef(new VectorLayer({ source: pathSource.current }));

	const [selectedUnit, setSelectedUnit] = useState<Entity | null>(null);
	const [showDistanceModal, setShowDistanceModal] = useState(false);
	const [selectedForDistance, setSelectedForDistance] = useState<Entity[]>([]);

	const {
		socketRef,
		entities,
		log,
		setLog,
		logMsg,
		isConnected,
		simulationTime,
	} = useSimulationSocket(mapObj.current, entitySource.current);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setShowDistanceModal(false);
		};

		window.addEventListener("keydown", handleKey);

		return () => window.removeEventListener("keydown", handleKey);
	}, []);

	const renderPanel = (id: PanelId) => {
		switch (id) {
			case "map":
				return (
					<SimulationMap
						mapRef={mapRef}
						mapRefObj={mapObj}
						entityLayer={entityLayer.current}
						pathLayer={pathLayer.current}
						pathSource={pathSource.current}
						setSelectedUnit={setSelectedUnit}
						log={logMsg}
					/>
				);

			case "controls":
				return (
					<ControlPanel
						socket={socketRef}
						setLog={setLog}
						onMeasure={() => setShowDistanceModal(true)}
						simulationTime={simulationTime}
					/>
				);

			case "entities":
				return (
					<EntityListPanel
						entities={entities}
						selectedEntity={selectedUnit}
						onSelect={(e) => {
							setSelectedUnit(e);
							drawEntityPath(e, pathSource.current);
							logMsg(`Unit ${e.callsign} selected`);
						}}
					/>
				);

			case "unitInfo":
				return <UnitInfoPanel selectedUnit={selectedUnit} />;

			case "log":
				return <LogPanel log={log} />;
		}
	};

	return (
		<div className="h-screen bg-gray-100">
			<SimulationConnectionStatus isConnected={isConnected} />

			{isConnected && (
				<>
					<Mosaic<PanelId>
						renderTile={(id, path) => (
							<MosaicWindow<PanelId>
								path={path}
								title=" "
								createNode={() => id}
								renderToolbar={() => (
									<div className="flex items-center gap-2 px-3 py-1 font-medium text-sm text-gray-800">
										{panelTitles[id].icon}
										<span>{panelTitles[id].label}</span>
									</div>
								)}
							>
								{renderPanel(id)}
							</MosaicWindow>
						)}
						initialValue={initialLayout}
					/>

					{showDistanceModal && (
						<DistanceMeasurementModal
							entities={entities}
							selected={selectedForDistance}
							setSelected={(sel) => {
								setSelectedForDistance(sel);
								if (sel.length === 2) {
									logMsg(
										`Measuring distance between ${sel[0].callsign} and ${sel[1].callsign}`,
									);
								}
							}}
							onClose={() => setShowDistanceModal(false)}
							pathSource={pathSource}
						/>
					)}
				</>
			)}
		</div>
	);
}

export default App;
