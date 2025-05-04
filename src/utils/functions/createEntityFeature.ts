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

	switch (entity.type) {
		case "infantry":
			iconPath = "/images/infantry.png";
			break;
		case "tank":
			iconPath = "/images/armour.png";
			break;
		case "recon":
			iconPath = "/images/motorized_recon.png";
			break;
	}

	const tint = entity.active
		? entity.side === "enemy" ? [255, 100, 100] : [100, 150, 255]
		: [128, 128, 128]; // gray if destroyed

	feature.setStyle(
		new Style({
			image: new Icon({
				src: iconPath,
				color: `rgb(${tint.join(",")})`,
				scale: 0.05,
				rotation: ((entity.heading ?? 0) * Math.PI) / 180,
				opacity: entity.active ? 1 : 0.5,
				anchor: [0.5, 0.5],
				anchorXUnits: "fraction",
				anchorYUnits: "fraction",
			}),
		}),
	);

	return feature;
};
