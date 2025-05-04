import {
	Play,
	Pause,
	StopCircle,
	RotateCcw,
	Ruler,
	FastForward,
	Rewind,
} from "lucide-react";
import React, { useState, type RefObject } from "react";

import type { Socket } from "socket.io-client";

import { ControlButton } from "@/components/Buttons/ControlButton";
import { SpeedSelector } from "@/components/Buttons/SpeedSelector";
import { TimeDisplay } from "@/components/Loging/TimeDisplay";
import { formatTime } from "@/utils/functions/time";

interface ControlPanelProps {
	socket: RefObject<Socket | null>,
	setLog: React.Dispatch<React.SetStateAction<string[]>>,
	onMeasure: ()=> void,
	simulationTime: number,
}

type ControlState = "play" | "pause" | "stop" | "step" | "reverse" | null;

export function ControlPanel({
	socket,
	setLog,
	onMeasure,
	simulationTime,
}: ControlPanelProps) {
	const [simSpeed, setSimSpeed] = useState(1);
	const [activeControl, setActiveControl] = useState<ControlState>(null);

	const handleSimControl = (action: ControlState) => {
		socket.current?.emit("control", action);
		setActiveControl(action);
		if (action === "reverse") {
			setLog((prev) => [...prev, `[${formatTime(simulationTime)}] Stepped backward`]);
		}
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

	return (
		<div className="p-4 text-sm text-gray-800 font-medium space-y-3">
			<div className="flex items-center justify-center gap-3 flex-wrap sm:flex-nowrap">
				<ControlButton icon={<Rewind size={20} />} onClick={() => handleSimControl("reverse")} title="Step Back" active={activeControl === "reverse"} />
				<ControlButton icon={<FastForward size={20} />} onClick={() => handleSimControl("step")} title="Step" active={activeControl === "step"} />
				<ControlButton icon={<Play size={20} />} onClick={() => handleSimControl("play")} title="Play" active={activeControl === "play"} />
				<ControlButton icon={<Pause size={20} />} onClick={() => handleSimControl("pause")} title="Pause" active={activeControl === "pause"} />
				<ControlButton icon={<StopCircle size={20} />} onClick={() => handleSimControl("stop")} title="Stop" active={activeControl === "stop"} />

				<ControlButton icon={<RotateCcw size={20} />} onClick={handleReset} title="Reset" color="red" />
				<ControlButton icon={<Ruler size={20} />} onClick={onMeasure} title="Measure distance" color="blue" />

				<SpeedSelector value={simSpeed} onChange={handleSpeedChange} options={availableSpeeds} />
				<TimeDisplay time={formatTime(simulationTime)} />
			</div>
		</div>
	);
}
