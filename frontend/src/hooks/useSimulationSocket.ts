import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

import type { Entity } from "@/utils/Entities/Entity";
import type { Feature } from "ol";
import type { Map } from "ol";
import type { Geometry } from "ol/geom";
import type VectorSource from "ol/source/Vector";

import { createEntityFeature } from "@/utils/functions/createEntityFeature";
import { fitMapToEntities } from "@/utils/functions/mapUtils";
import { formatTime } from "@/utils/functions/time";

interface UseSimulationSocketResult {
	socketRef: React.RefObject<Socket | null>,
	entities: Entity[],
	log: string[],
	setLog: React.Dispatch<React.SetStateAction<string[]>>,
	logMsg: (msg: string)=> void,
	isConnected: boolean,
	simulationTime: number,
}

export function useSimulationSocket(
	map: Map | null,
	entitySource: VectorSource<Feature<Geometry>>,
	socketUrl = "ws://localhost:9999",
): UseSimulationSocketResult {
	const socketRef = useRef<Socket | null>(null);
	const [log, setLog] = useState<string[]>(["[00:00:00] Sim start"]);
	const [entities, setEntities] = useState<Entity[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [simulationTime, setSimulationTime] = useState(0);

	const logMsg = (msg: string) => {
		setLog((prev) => [...prev, `[${formatTime(simulationTime)}] ${msg}`]);
	};

	useEffect(() => {
		const socket = io(socketUrl);
		socketRef.current = socket;

		socket.on("connect", () => setIsConnected(true));
		socket.on("disconnect", () => setIsConnected(false));

		socket.on("entityCreated", (entity: Entity) => {
			setEntities((prev) => {
				if (prev.some((e) => e.callsign === entity.callsign)) return prev;

				const exists = entitySource.getFeatures().some(
					(f) => f.get("entity")?.callsign === entity.callsign,
				);

				if (!exists) {
					const feature = createEntityFeature(entity);
					entitySource.addFeature(feature);
					if (map) fitMapToEntities(map, entitySource.getFeatures());
				}

				return [...prev, entity];
			});
		});

		socket.on("entityUpdated", (update: Entity) => {
			const feature = entitySource.getFeatures().find(
				(f) => f.get("entity")?.callsign === update.callsign,
			);

			if (feature) {
				const geom = feature.getGeometry();
				if (geom instanceof Point) {
					geom.setCoordinates(fromLonLat([update.lon, update.lat]));
				}

				feature.set("entity", update);
				feature.setStyle(createEntityFeature(update).getStyle());
			}

			setEntities((prev) =>
				prev.map((e) => (e.callsign === update.callsign ? update : e)),
			);
		});

		socket.on("entityDestroyed", ({ callsign }: { callsign: string }) => {
			const feature = entitySource.getFeatures().find(
				(f) => f.get("entity")?.callsign === callsign,
			);

			if (feature) {
				const entity = feature.get("entity") as Entity;
				entity.active = false;
				feature.set("entity", entity);
				feature.setStyle(createEntityFeature(entity).getStyle());
			}

			setEntities((prev) =>
				prev.map((e) =>
					e.callsign === callsign ? { ...e, active: false } : e,
				),
			);
		});

		socket.on("log", ({ msg, time }: { msg: string, time: number }) => {
			setLog((prev) => [...prev, `[${formatTime(time)}] ${msg}`]);
		});

		socket.on("timeUpdate", setSimulationTime);

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [entitySource]);

	return {
		socketRef,
		entities,
		log,
		setLog,
		logMsg,
		isConnected,
		simulationTime,
	};
}
