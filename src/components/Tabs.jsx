import { useLayoutEffect, useRef, useState } from 'react';

// Tab strip with an orange indicator that slides to the active tab.
export default function Tabs({ items, value, onChange, label, className = '' }) {
	const listRef = useRef(null);
	const [indicator, setIndicator] = useState(null);

	useLayoutEffect(() => {
		const update = () => {
			const active = listRef.current?.querySelector('[aria-selected="true"]');
			if (!active) return;
			const left = active.offsetLeft;
			const width = active.offsetWidth;
			setIndicator((prev) =>
				prev && prev.left === left && prev.width === width ? prev : { left, width }
			);
		};

		update();
		document.fonts?.ready.then(update);
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [value, items]);

	return (
		<div className={`tabs ${className}`} role="tablist" aria-label={label} ref={listRef}>
			{items.map((item) => (
				<button
					key={item.value}
					type="button"
					role="tab"
					className="tab"
					aria-selected={item.value === value}
					onClick={() => onChange(item.value)}
				>
					{item.icon}
					<span>{item.label}</span>
				</button>
			))}
			{indicator && (
				<span
					className="tab-indicator"
					style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
				/>
			)}
		</div>
	);
}
