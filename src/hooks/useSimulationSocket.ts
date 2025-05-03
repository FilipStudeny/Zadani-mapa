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
	socketUrl: string = "ws://localhost:9999",
): UseSimulationSocketResult {
	const socketRef = useRef<Socket | null>(null);
	const [log, setLog] = useState<string[]>(["[00:00:00] Sim start"]);
	const [entities, setEntities] = useState<Entity[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [simulationTime, setSimulationTime] = useState(0);

	const logMsg = (msg: string) => {
		const formatTime = (seconds: number) => {
			const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
			const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
			const secs = String(seconds % 60).padStart(2, "0");

			return `${hrs}:${mins}:${secs}`;
		};

		setLog((prev) => [...prev, `[${formatTime(simulationTime)}] ${msg}`]);
	};

	useEffect(() => {
		const socket = io(socketUrl);
		socketRef.current = socket;

		const handleConnect = () => setIsConnected(true);
		const handleDisconnect = () => setIsConnected(false);

		const handleEntityCreated = (entity: Entity) => {
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
		};

		const handleEntityUpdated = ({
			callsign,
			lat,
			lon,
			heading,
		}: Pick<Entity, "callsign" | "lat" | "lon" | "heading">) => {
			const feature = entitySource.getFeatures().find(
				(f) => f.get("entity")?.callsign === callsign,
			);

			if (feature) {
				const geom = feature.getGeometry();
				if (geom instanceof Point) {
					geom.setCoordinates(fromLonLat([lon, lat]));
				}

				const e = feature.get("entity") as Entity;
				if (e) {
					e.lat = lat;
					e.lon = lon;
					e.heading = heading;
					feature.set("entity", e);
					feature.setStyle(createEntityFeature(e).getStyle());
				}
			}
		};

		const handleTimeUpdate = (time: number) => {
			setSimulationTime(time);
		};

		type LogPayload = { msg: string, time: number };

		const handleLog = ({ msg, time }: LogPayload) => {
			const formatTime = (seconds: number) => {
				const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
				const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
				const secs = String(seconds % 60).padStart(2, "0");

				return `${hrs}:${mins}:${secs}`;
			};

			setLog((prev) => [...prev, `[${formatTime(time)}] ${msg}`]);
		};

		socket.on("connect", handleConnect);
		socket.on("disconnect", handleDisconnect);
		socket.on("entityCreated", handleEntityCreated);
		socket.on("entityUpdated", handleEntityUpdated);
		socket.on("log", handleLog);
		socket.on("timeUpdate", handleTimeUpdate);

		return () => {
			socket.off("connect", handleConnect);
			socket.off("disconnect", handleDisconnect);
			socket.off("entityCreated", handleEntityCreated);
			socket.off("entityUpdated", handleEntityUpdated);
			socket.off("log", handleLog);
			socket.off("timeUpdate", handleTimeUpdate);
			socket.disconnect();
		};
	}, [map, entitySource, simulationTime]);

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
