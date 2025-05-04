export const TimeDisplay = ({ time }: { time: string }) => (
	<div className="flex items-center gap-2 border-l pl-4 border-gray-300">
		<span className="text-xs uppercase text-gray-500">Time:</span>
		<span className="text-xl font-mono tracking-widest">{time}</span>
	</div>
);
