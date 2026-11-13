import { useState } from 'react';

const W = 420;
const H = 180;
const PAD = { top: 14, right: 64, bottom: 28, left: 36 };

// Validated pair (dark chart surface): series 1 brand orange, series 2 blue.
export const SERIES_COLORS = ['#fb4c04', '#3b8eff'];

function niceMax(value) {
	if (value <= 0) return 10;
	const magnitude = 10 ** Math.floor(Math.log10(value));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s * 4 >= value);
	return Math.ceil(value / step) * step;
}

// Cumulative points after each round, for one driver or two being compared.
// labels: round names; series: [{ name, values: [{ value, gained }] }]
// (gained is null for rounds the driver didn't start). One series needs no
// legend (the heading names it); two get a legend plus end-of-line labels.
// The results table under the chart is its table view.
export default function PointsChart({ labels, series }) {
	const [hover, setHover] = useState(null);
	if (labels.length === 0) return null;

	const max = niceMax(Math.max(...series.flatMap((s) => s.values.map((v) => v.value))));
	const plotW = W - PAD.left - PAD.right;
	const plotH = H - PAD.top - PAD.bottom;
	const x = (i) => (labels.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i * plotW) / (labels.length - 1));
	const y = (v) => PAD.top + (1 - v / max) * plotH;
	const baseline = y(0);
	const slot = labels.length === 1 ? plotW : plotW / (labels.length - 1);
	const last = labels.length - 1;

	// End labels: nudge apart if the two lines finish close together.
	const endY = series.map((s) => y(s.values[last].value));
	if (endY.length === 2 && Math.abs(endY[0] - endY[1]) < 14) {
		const mid = (endY[0] + endY[1]) / 2;
		const [hi, lo] = endY[0] <= endY[1] ? [0, 1] : [1, 0];
		endY[hi] = mid - 7;
		endY[lo] = mid + 7;
	}

	const tooltipAlign = hover === null ? '' : x(hover) / W < 0.3 ? ' align-start' : x(hover) / W > 0.65 ? ' align-end' : '';
	const tooltipTop = hover === null ? 0 : Math.min(...series.map((s) => y(s.values[hover].value)));

	return (
		<div className="chart">
			{series.length > 1 && (
				<ul className="chart-legend">
					{series.map((s, i) => (
						<li key={s.name}>
							<span className="legend-swatch" style={{ background: SERIES_COLORS[i] }} />
							{s.name}
						</li>
					))}
				</ul>
			)}

			<div className="chart-plot" onPointerLeave={() => setHover(null)}>
				<svg
					viewBox={`0 0 ${W} ${H}`}
					role="img"
					aria-label={series
						.map((s) => `${s.name}: ${s.values.map((v, i) => `${labels[i]} ${v.value}`).join(', ')}`)
						.join('. ')}
				>
					{[0, max / 2, max].map((tick) => (
						<g key={tick}>
							<line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} />
							<text className="chart-axis" x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
								{tick}
							</text>
						</g>
					))}
					{labels.map((label, i) => (
						<text key={label + i} className="chart-axis" x={x(i)} y={H - 8} textAnchor="middle">
							R{i + 1}
						</text>
					))}

					{hover !== null && <line className="chart-crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={baseline} />}

					{series.map((s, si) => {
						const line = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v.value)}`).join(' ');
						const color = SERIES_COLORS[si];
						return (
							<g key={s.name}>
								{labels.length > 1 && series.length === 1 && (
									<path className="chart-area" style={{ fill: color }} d={`${line} L${x(last)},${baseline} L${x(0)},${baseline} Z`} />
								)}
								{labels.length > 1 && <path className="chart-line" style={{ stroke: color }} d={line} />}
								{s.values.map((v, i) => (
									<circle key={i} className="chart-dot" style={{ fill: color }} cx={x(i)} cy={y(v.value)} r={hover === i ? 6 : 4} />
								))}
								{series.length > 1 && (
									<text className="chart-end-label" x={x(last) + 10} y={endY[si]} dominantBaseline="middle">
										{s.values[last].value}
									</text>
								)}
							</g>
						);
					})}

					{/* Hit areas, wider than the marks */}
					{labels.map((label, i) => (
						<rect
							key={label + i}
							className="chart-hit"
							x={x(i) - slot / 2}
							y={0}
							width={slot}
							height={H}
							tabIndex={0}
							aria-label={`${label}: ${series.map((s) => `${s.name} ${s.values[i].value} points`).join(', ')}`}
							onPointerEnter={() => setHover(i)}
							onFocus={() => setHover(i)}
							onBlur={() => setHover(null)}
						/>
					))}
				</svg>

				{hover !== null && (
					<div
						className={`chart-tooltip${tooltipAlign}`}
						style={{ left: `${(x(hover) / W) * 100}%`, top: `${(tooltipTop / H) * 100}%` }}
					>
						<strong>{labels[hover]}</strong>
						{series.map((s, si) => {
							const v = s.values[hover];
							return (
								<span key={s.name} className="tooltip-row">
									{series.length > 1 && <span className="legend-swatch" style={{ background: SERIES_COLORS[si] }} />}
									{series.length > 1 && `${s.name}: `}
									{v.value} pts{v.gained === null ? ' · did not start' : ` · +${v.gained}`}
								</span>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
