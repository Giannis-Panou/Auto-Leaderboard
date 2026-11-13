import { useState } from 'react';

const W = 400;
const H = 170;
const PAD = { top: 14, right: 16, bottom: 28, left: 36 };

function niceMax(value) {
	if (value <= 0) return 10;
	const magnitude = 10 ** Math.floor(Math.log10(value));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s * 4 >= value);
	return Math.ceil(value / step) * step;
}

// Cumulative points after each round. data: [{ label, value, gained }]
// (gained is null for rounds the driver didn't start). Single series, so the
// panel heading names it and there's no legend; the results table below the
// chart is its table view.
export default function PointsChart({ data }) {
	const [hover, setHover] = useState(null);
	if (data.length === 0) return null;

	const max = niceMax(Math.max(...data.map((d) => d.value)));
	const plotW = W - PAD.left - PAD.right;
	const plotH = H - PAD.top - PAD.bottom;
	const x = (i) => (data.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i * plotW) / (data.length - 1));
	const y = (v) => PAD.top + (1 - v / max) * plotH;
	const baseline = y(0);

	const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');
	const area = `${line} L${x(data.length - 1)},${baseline} L${x(0)},${baseline} Z`;
	const slot = data.length === 1 ? plotW : plotW / (data.length - 1);
	const active = hover !== null ? data[hover] : null;

	return (
		<div className="chart" onPointerLeave={() => setHover(null)}>
			<svg
				viewBox={`0 0 ${W} ${H}`}
				role="img"
				aria-label={`Points after each round: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
			>
				{[0, max / 2, max].map((tick) => (
					<g key={tick}>
						<line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} />
						<text className="chart-axis" x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
							{tick}
						</text>
					</g>
				))}
				{data.map((d, i) => (
					<text key={d.label} className="chart-axis" x={x(i)} y={H - 8} textAnchor="middle">
						R{i + 1}
					</text>
				))}

				{active && <line className="chart-crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={baseline} />}
				{data.length > 1 && (
					<>
						<path className="chart-area" d={area} />
						<path className="chart-line" d={line} />
					</>
				)}
				{data.map((d, i) => (
					<circle key={d.label} className="chart-dot" cx={x(i)} cy={y(d.value)} r={hover === i ? 6 : 4} />
				))}

				{/* Hit areas, wider than the marks */}
				{data.map((d, i) => (
					<rect
						key={d.label}
						className="chart-hit"
						x={x(i) - slot / 2}
						y={0}
						width={slot}
						height={H}
						tabIndex={0}
						aria-label={`${d.label}: ${d.value} points`}
						onPointerEnter={() => setHover(i)}
						onFocus={() => setHover(i)}
						onBlur={() => setHover(null)}
					/>
				))}
			</svg>

			{active && (
				<div
					className={`chart-tooltip${x(hover) / W < 0.3 ? ' align-start' : x(hover) / W > 0.7 ? ' align-end' : ''}`}
					style={{
						left: `${(x(hover) / W) * 100}%`,
						top: `${(y(active.value) / H) * 100}%`,
					}}
				>
					<strong>{active.label}</strong>
					<span>
						{active.value} pts
						{active.gained === null ? ' · did not start' : ` · +${active.gained}`}
					</span>
				</div>
			)}
		</div>
	);
}
