import { useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/format';

const FLASH_UP = 'rgba(25, 179, 125, 0.45)';
const FLASH_DOWN = 'rgba(255, 77, 77, 0.4)';

// FLIP reorder animation: after each render, rows (children with
// data-flip-key) that changed position slide from their old spot to the new
// one and flash green (moved up) or red (moved down).
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
			for (const row of list.children) {
				const key = row.dataset.flipKey;
				if (!key) continue;

				const top = row.offsetTop;
				const prev = positions.current.get(key);
				next.set(key, top);

				if (!animate || prev === undefined || prev === top) continue;

				row.animate(
					[{ transform: `translateY(${prev - top}px)` }, { transform: 'translateY(0)' }],
					{ duration: 550, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
				);
				row.animate([{ backgroundColor: prev > top ? FLASH_UP : FLASH_DOWN }], {
					duration: 1100,
					easing: 'ease-out',
				});
			}
		}

		positions.current = next;
	});
}
