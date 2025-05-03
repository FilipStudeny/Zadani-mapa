import {
	Play,
	Pause,
	StopCircle,
	RotateCcw,
	Ruler,
	FastForward,
} from "lucide-react";
import React, { useState, type RefObject } from "react";

import type { Socket } from "socket.io-client";

interface ControlPanelProps {
	socket: RefObject<Socket | null>,
	setLog: React.Dispatch<React.SetStateAction<string[]>>,
	onMeasure: ()=> void,
	simulationTime: number,
}

type ControlState = "play" | "pause" | "stop" | "step" | null;

export function ControlPanel({
	socket,
	setLog,
	onMeasure,
	simulationTime,
}: ControlPanelProps) {
	const [simSpeed, setSimSpeed] = useState(1);
	const [activeControl, setActiveControl] = useState<ControlState>(null);

	const formatTime = (seconds: number) => {
		const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
		const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
		const secs = String(seconds % 60).padStart(2, "0");

		return `${hrs}:${mins}:${secs}`;
	};

	const handleSimControl = (action: ControlState) => {
		socket.current?.emit("control", action);
		setActiveControl(action);
	};

	const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const speed = parseInt(e.target.value, 10);
		setSimSpeed(speed);
		socket.current?.emit("setSpeed", speed);
	};

	const handleReset = () => {
		setLog((prev) => [...prev, "[00:00:00] Simulation reset"]);
		socket.current?.emit("reset");
		setActiveControl(null);
	};

	const availableSpeeds = [1, 2, 5, 10, 15, 20];

	const buttonStyle = (control: ControlState) =>
		`p-2 rounded ${
			activeControl === control
				? "bg-blue-500 text-white"
				: "bg-gray-200 hover:bg-gray-300"
		}`;

	return (
		<div className="p-4 text-sm text-gray-800 font-medium space-y-3">
			<div className="flex items-center justify-center gap-3 flex-wrap sm:flex-nowrap">
				<button onClick={() => handleSimControl("step")} title="Step" className={buttonStyle("step")}>
					<FastForward size={20} />
				</button>
				<button onClick={() => handleSimControl("play")} title="Play" className={buttonStyle("play")}>
					<Play size={20} />
				</button>
				<button onClick={() => handleSimControl("pause")} title="Pause" className={buttonStyle("pause")}>
					<Pause size={20} />
				</button>
				<button onClick={() => handleSimControl("stop")} title="Stop" className={buttonStyle("stop")}>
					<StopCircle size={20} />
				</button>
				<button
					onClick={handleReset}
					title="Reset"
					className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded"
				>
					<RotateCcw size={20} />
				</button>
				<button
					onClick={onMeasure}
					title="Measure distance"
					className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
				>
					<Ruler size={20} />
				</button>

				<div className="flex items-center gap-2">
					<label className="text-gray-700" htmlFor="speed-select">
						Speed:
					</label>
					<select
						id="speed-select"
						value={simSpeed}
						onChange={handleSpeedChange}
						className="px-2 py-1 border rounded w-20 text-center"
					>
						{availableSpeeds.map((val) => (
							<option key={val} value={val}>
								{val}×
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-2 border-l pl-4 border-gray-300">
					<span className="text-xs uppercase text-gray-500">Time:</span>
					<span className="text-xl font-mono tracking-widest">{formatTime(simulationTime)}</span>
				</div>
			</div>
		</div>
	);
}
