import { Feature } from "ol";
import { boundingExtent } from "ol/extent";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Stroke, Style } from "ol/style";

import type { Entity } from "../Entities/Entity";
import type { Map } from "ol";

export const drawEntityPath = (entity: Entity, pathSource: any) => {
	pathSource.clear();
	if (entity.path.length === 0) return;
	const coords = entity.path.map((p) => fromLonLat([p.lon, p.lat]));
	const feature = new Feature({ geometry: new LineString(coords) });
	feature.setStyle(new Style({ stroke: new Stroke({ color: "#ff0000", width: 2 }) }));
	pathSource.addFeature(feature);
};

export const fitMapToEntities = (map: Map, features: Feature[]) => {
	if (features.length === 0) return;
	const extent = boundingExtent(features.map((f) => (f.getGeometry() as Point).getCoordinates()));
	map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 17 });
};
