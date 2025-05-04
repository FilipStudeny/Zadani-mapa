interface SpeedSelectorProps {
	value: number,
	onChange: (e: React.ChangeEvent<HTMLSelectElement>)=> void,
	options: number[],
}

export const SpeedSelector = ({ value, onChange, options }: SpeedSelectorProps) => (
	<div className="flex items-center gap-2">
		<label className="text-gray-700" htmlFor="speed-select">Speed:</label>
		<select
			id="speed-select"
			value={value}
			onChange={onChange}
			className="px-2 py-1 border rounded w-20 text-center"
		>
			{options.map((val) => (
				<option key={val} value={val}>{val}×</option>
			))}
		</select>
	</div>
);
