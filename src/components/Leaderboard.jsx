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

// Driver/team name. Drivers get a flag (the "rest of the world" flag when
// they have no nationality); teams don't.
export function NameCell({ name, driver, nat, platform, className = 'row-name' }) {
	return (
		<span className={className}>
			{driver && <Flag nat={nat} />}
			<span className="name-text" title={name}>
				{name}
			</span>
			<PlatformBadge platform={platform} />
		</span>
	);
}

// Props that make a whole row (li or tr) open/close the driver profile.
export function selectableRow(name, onSelect, expanded) {
	if (!onSelect) return {};
	return {
		role: 'button',
		tabIndex: 0,
		'aria-expanded': expanded,
		'aria-label': `${name} — ${expanded ? 'hide' : 'show'} driver profile`,
		onClick: () => onSelect(name),
		onKeyDown: (e) => {
			if (e.target !== e.currentTarget) return;
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onSelect(name);
			}
		},
	};
}

// One leaderboard row. `index` drives the staggered reveal animation.
// With onSelect, clicking anywhere on the row toggles the driver profile.
export function Row({ rank, index, name, driver, nat, platform, onSelect, expanded, sub, chip, value, valueTitle, muted, delta, dnf }) {
	return (
		<li
			className={`row${sub ? ' has-sub' : ''}${dnf ? ' is-dnf' : ''}${onSelect ? ' is-selectable' : ''}${expanded ? ' is-expanded' : ''}`}
			style={{ '--i': Math.min(index, 20) }}
			data-flip-key={name}
			{...selectableRow(name, onSelect, expanded)}
		>
			<Badge rank={rank} />
			<NameCell name={name} driver={driver} nat={nat} platform={platform} />
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

// The driver profile, shown as an extra list item right under its row.
export function DetailItem({ children }) {
	return <li className="row-detail">{children}</li>;
}

// Which driver's profile is open in a list (one at a time, click again to close).
export function useExpandedDriver() {
	const [expanded, setExpanded] = useState(null);
	const toggle = (name) => setExpanded((current) => (current === name ? null : name));
	return [expanded, toggle, () => setExpanded(null)];
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
