interface ControlButtonProps {
	icon: React.ReactNode,
	onClick: ()=> void,
	title: string,
	active?: boolean,
	color?: "default" | "blue" | "red",
}

export const ControlButton = ({
	icon,
	onClick,
	title,
	active = false,
	color = "default",
}: ControlButtonProps) => {
	const base = "p-2 rounded transition-colors";
	const colorClasses =
		color === "blue"
			? "bg-blue-100 hover:bg-blue-200 text-blue-700"
			: color === "red"
				? "bg-red-100 hover:bg-red-200 text-red-700"
				: active
					? "bg-blue-500 text-white"
					: "bg-gray-200 hover:bg-gray-300";

	return (
		<button onClick={onClick} title={title} className={`${base} ${colorClasses}`}>
			{icon}
		</button>
	);
};
