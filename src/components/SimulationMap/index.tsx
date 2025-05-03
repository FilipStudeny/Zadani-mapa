import { Map, View } from "ol";
import { defaults as defaultControls } from "ol/control";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import { useEffect } from "react";
import React from "react";

import type { Entity } from "@/utils/Entities/Entity";

import { drawEntityPath } from "@/utils/functions/mapUtils";

interface SimulationMapProps {
	mapRef: React.RefObject<HTMLDivElement | null>,
	mapRefObj?: React.MutableRefObject<Map | null>,
	onEntitySelect?: (entity: Entity)=> void,
	entityLayer?: any,
	pathLayer?: any,
	pathSource?: any,
	log?: (msg: string)=> void,
	setSelectedUnit?: (entity: Entity)=> void,
}

export const SimulationMap = React.memo(function SimulationMap({
	mapRef,
	mapRefObj,
	onEntitySelect,
	entityLayer,
	pathLayer,
	pathSource,
	log,
	setSelectedUnit,
}: SimulationMapProps) {
	useEffect(() => {
		if (!mapRef.current) return;

		const map = new Map({
			target: mapRef.current,
			layers: [
				new TileLayer({ source: new OSM() }),
				...(pathLayer ? [pathLayer] : []),
				...(entityLayer ? [entityLayer] : []),
			],
			view: new View({
				center: fromLonLat([17.522, 49.634]),
				zoom: 14,
			}),
			controls: defaultControls({ attribution: false, zoom: false }),
		});

		if (mapRefObj) {
			mapRefObj.current = map;
		}

		map.on("click", (evt) => {
			map.forEachFeatureAtPixel(evt.pixel, (feature) => {
				const entity = feature.get("entity") as Entity;
				if (entity) {
					setSelectedUnit?.(entity);
					drawEntityPath(entity, pathSource);

					log?.(`Unit ${entity.callsign} selected`);
					onEntitySelect?.(entity);
				}
			});
		});

		return () => map.setTarget(undefined);
	}, []);

	return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
});
