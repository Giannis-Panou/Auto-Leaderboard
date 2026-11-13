import { useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/format';

const FLASH_UP = 'rgba(25, 179, 125, 0.45)';
const FLASH_DOWN = 'rgba(255, 77, 77, 0.4)';

// FLIP reorder animation: after each render, rows (children with
// data-flip-key) whose place in the order changed slide from their old spot
// to the new one and flash green (moved up) or red (moved down).
// Rows that merely shifted on screen (e.g. a profile opened above them) keep
// their order index, so they are not animated.
// Changing `resetKey` (e.g. switching tabs) records new positions without
// animating, since that's a different list rather than a reorder.
export function useFlip(listRef, resetKey) {
	const positions = useRef(new Map());
	const lastResetKey = useRef(resetKey);

	useLayoutEffect(() => {
		const list = listRef.current;
		const next = new Map();
		const isReset = lastResetKey.current !== resetKey;
		lastResetKey.current = resetKey;

		if (list) {
			const animate = !isReset && !prefersReducedMotion();
			let index = 0;
			for (const row of list.children) {
				const key = row.dataset.flipKey;
				if (!key) continue;

				const top = row.offsetTop;
				const prev = positions.current.get(key);
				next.set(key, { top, index });

				if (animate && prev && prev.index !== index && prev.top !== top) {
					row.animate(
						[{ transform: `translateY(${prev.top - top}px)` }, { transform: 'translateY(0)' }],
						{ duration: 550, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
					);
					row.animate([{ backgroundColor: prev.index > index ? FLASH_UP : FLASH_DOWN }], {
						duration: 1100,
						easing: 'ease-out',
					});
				}
				index++;
			}
		}

		positions.current = next;
	});
}
