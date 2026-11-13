import { Children, useEffect, useRef, useState } from 'react';
import { FlagIcon } from './Icons';
import { Flag, PlatformBadge } from './DriverMeta';
import { prefersReducedMotion } from '../lib/format';

export function Panel({ title, count, tabs, actions, className = '', children }) {
	return (
		<section className={`panel ${className}`}>
			<div className="panel-head">
				<div className="panel-title-row">
					<h2>
						{title}
						{count > 0 && <span className="panel-count">{count}</span>}
					</h2>
					{actions && <div className="panel-actions">{actions}</div>}
				</div>
				{tabs}
			</div>
			{children}
		</section>
	);
}

export function EmptyState({ title = 'No results yet', message = 'Upload a results CSV or try a demo round.' }) {
	return (
		<div className="empty">
			<FlagIcon size={28} />
			<strong>{title}</strong>
			<span>{message}</span>
		</div>
	);
}

export function List({ listRef, emptyTitle, emptyMessage, children }) {
	const items = Children.toArray(children);
	if (items.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />;
	return (
		<ol className="list" ref={listRef}>
			{items}
		</ol>
	);
}

export function Badge({ rank, className = '' }) {
	const podium = typeof rank === 'number' && rank <= 3 ? ` p${rank}` : '';
	return <span className={`badge${podium} ${className}`}>{rank}</span>;
}

// Driver/team name, clickable when onSelect is set. Drivers get a flag (the
// "rest of the world" flag when they have no nationality); teams don't.
export function NameCell({ name, driver, nat, platform, onSelect, className = 'row-name' }) {
	return (
		<span className={className}>
			{driver && <Flag nat={nat} />}
			{onSelect ? (
				<button type="button" className="name-link" title={`${name} — view driver`} onClick={() => onSelect(name)}>
					{name}
				</button>
			) : (
				<span className="name-text" title={name}>
					{name}
				</span>
			)}
			<PlatformBadge platform={platform} />
		</span>
	);
}

// One leaderboard row. `index` drives the staggered reveal animation.
export function Row({ rank, index, name, driver, nat, platform, onSelect, sub, chip, value, valueTitle, muted, delta, dnf }) {
	return (
		<li
			className={`row${sub ? ' has-sub' : ''}${dnf ? ' is-dnf' : ''}`}
			style={{ '--i': Math.min(index, 20) }}
			data-flip-key={name}
		>
			<Badge rank={rank} />
			<NameCell name={name} driver={driver} nat={nat} platform={platform} onSelect={onSelect} />
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

// Position change since the previous round, as a symbol + number.
export function deltaText(change) {
	if (change === undefined) return '';
	if (change === 0) return '–';
	return `${change > 0 ? '▲' : '▼'}${Math.abs(change)}`;
}

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
		<span className={`delta ${up ? 'up' : 'down'}`} aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(change)}`}>
			{deltaText(change)}
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
