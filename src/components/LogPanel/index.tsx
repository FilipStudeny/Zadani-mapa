import { useEffect, useRef } from "react";

interface LogPanelProps {
	log: string[],
}

export function LogPanel({ log }: LogPanelProps) {
	const logEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		logEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [log]);

	return (
		<div
			className="p-3 bg-zinc-900 text-gray-100 overflow-y-auto text-sm font-mono rounded shadow-inner"
			style={{
				height: "100%",
				minHeight: "100px",
			}}
		>
			{log.map((entry, index) => (
				<div key={index} className="whitespace-pre-wrap">
					{entry}
				</div>
			))}
			<div ref={logEndRef} />
		</div>
	);
}
