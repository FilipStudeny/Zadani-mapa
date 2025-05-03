import { Feature } from "ol";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Style, Icon } from "ol/style";

import type { Entity } from "../Entities/Entity";
import type { Geometry } from "ol/geom";

export const createEntityFeature = (entity: Entity): Feature<Geometry> => {
	const feature = new Feature({
		geometry: new Point(fromLonLat([entity.lon, entity.lat])),
	});
	feature.set("entity", entity);

	let iconPath = "/images/default.png";
	if (entity.type === "infantry") iconPath = "/images/infantry.png";
	else if (entity.type === "tank" || entity.type === "armour") iconPath = "/images/armour.png";

	feature.setStyle(
		new Style({
			image: new Icon({
				src: iconPath,
				scale: 0.05,
				rotation: ((entity.heading ?? 0) * Math.PI) / 180,
				anchor: [0.5, 0.5],
				anchorXUnits: "fraction",
				anchorYUnits: "fraction",
			}),
		}),
	);

	return feature;
};
