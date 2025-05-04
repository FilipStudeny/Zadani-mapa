import type { Entity } from "@/utils/Entities/Entity";

export const getIconPath = (type: string) => {
	switch (type) {
		case "infantry":
			return "/images/infantry.png";
		case "tank":
		case "armour":
			return "/images/armour.png";
		case "recon":
			return "/images/motorized_recon.png";
		default:
			return "/images/default.png";
	}
};

export const getImageBg = (side: Entity["side"], active: boolean) => {
	if (!active) return "bg-gray-300";

	return side === "ally" ? "bg-blue-200" : "bg-red-200";
};

export const getSideColor = (side: Entity["side"]) =>
	side === "ally" ? "text-blue-700" : "text-red-600";

export const getSideBg = (side: Entity["side"]) =>
	side === "ally" ? "bg-blue-100" : "bg-red-100";
