
import { drawEntityPath } from "@/utils/functions/mapUtils";

import { createFileRoute } from "@tanstack/react-router";
import { Map } from "ol";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useState, useRef } from "react";
import { Mosaic, MosaicWindow } from "react-mosaic-component";

import type { Entity } from "@/utils/Entities/Entity";
import "react-mosaic-component/react-mosaic-component.css";

import type { PanelId } from "@/utils/Entities/PanelId";
import type { Geometry } from "ol/geom";

import { ControlPanel } from "@/components/ControlPanel";
import { DistanceMeasurementModal } from "@/components/DistanceMeasurementModal";
import { EntityListPanel } from "@/components/EntityListPanel";
import { LogPanel } from "@/components/LogPanel";
import { SimulationMap } from "@/components/SimulationMap";
import { UnitInfoPanel } from "@/components/UnitInfoPanel";
import { useSimulationSocket } from "@/hooks/useSimulationSocket";

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

	if (!isConnected) {
		return (
			<div
				style={{
					height: "100vh",
					width: "100vw",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "column",
					backgroundColor: "#0f172a",
					color: "#e2e8f0",
					fontFamily: "sans-serif",
				}}
			>
				<div
					style={{
						width: 60,
						height: 60,
						border: "6px solid #334155",
						borderTop: "6px solid #38bdf8",
						borderRadius: "50%",
						animation: "spin 1s linear infinite",
						marginBottom: 20,
					}}
				/>
				<div style={{ fontSize: "1.5rem", fontWeight: 500 }}>
					Connecting to simulation server...
				</div>
				<style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
			</div>
		);
	}

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
		<div style={{ height: "100vh" }}>
			<Mosaic<PanelId>
				renderTile={(id, path) => (
					<MosaicWindow<PanelId> path={path} title={id.toUpperCase()}>
						{renderPanel(id)}
					</MosaicWindow>
				)}
				initialValue={initialLayout}
			/>

			{showDistanceModal && (
				<DistanceMeasurementModal
					entities={entities}
					selected={selectedForDistance}
					setSelected={setSelectedForDistance}
					onClose={() => setShowDistanceModal(false)}
					pathSource={pathSource}
				/>
			)}
		</div>
	);
}

export default App;
