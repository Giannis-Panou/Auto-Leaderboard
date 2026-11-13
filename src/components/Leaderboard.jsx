import { Children, useEffect, useRef, useState } from 'react';
import { FlagIcon } from './Icons';
import { prefersReducedMotion } from '../lib/format';

export function Panel({ title, count, tabs, className = '', children }) {
	return (
		<section className={`panel ${className}`}>
			<div className="panel-head">
				<h2>
					{title}
					{count > 0 && <span className="panel-count">{count}</span>}
				</h2>
				{tabs}
			</div>
			{children}
		</section>
	);
}

export function EmptyState() {
	return (
		<div className="empty">
			<FlagIcon size={28} />
			<strong>No results yet</strong>
			<span>Upload a results CSV or try a demo round.</span>
		</div>
	);
}

export function List({ listRef, children }) {
	const items = Children.toArray(children);
	if (items.length === 0) return <EmptyState />;
	return (
		<ol className="list" ref={listRef}>
			{items}
		</ol>
	);
}

// One leaderboard row. `index` drives the staggered reveal animation.
export function Row({ rank, index, name, sub, chip, value, valueTitle, muted, delta }) {
	const badgeClass = rank <= 3 ? `badge p${rank}` : 'badge';
	return (
		<li
			className={`row${sub ? ' has-sub' : ''}`}
			style={{ '--i': Math.min(index, 20) }}
			data-flip-key={name}
		>
			<span className={badgeClass}>{rank}</span>
			<span className="row-name" title={name}>
				{name}
			</span>
			{sub && (
				<span className="row-sub" title={sub}>
					{sub}
				</span>
			)}
			{chip && <span className={`chip chip-${chip.toLowerCase()}`}>{chip}</span>}
			<span className={`row-value${muted ? ' is-muted' : ''}`} title={valueTitle}>
				{delta}
				{value}
			</span>
		</li>
	);
}

// Position change since the previous round.
export function Delta({ change }) {
	if (change === undefined) return null;
	if (change === 0)
		return (
			<span className="delta same" aria-label="No change">
				–
			</span>
		);
	const up = change > 0;
	return (
		<span
			className={`delta ${up ? 'up' : 'down'}`}
			aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(change)}`}
		>
			{up ? '▲' : '▼'}
			{Math.abs(change)}
		</span>
	);
}

// Animates from the previously shown number to the new value.
export function CountUp({ value, duration = 700 }) {
	const [display, setDisplay] = useState(value);
	const shown = useRef(value);

	useEffect(() => {
		const from = shown.current;
		if (from === value || prefersReducedMotion()) {
			shown.current = value;
			setDisplay(value);
			return;
		}

		let frame;
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			shown.current = Math.round(from + (value - from) * eased);
			setDisplay(shown.current);
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [value, duration]);

	return <span className="count">{display}</span>;
}
