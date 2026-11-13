const pad = (n, len = 2) => String(n).padStart(len, '0');

// 3565867 -> "59:25.867", 4035867 -> "1:07:15.867"
export function formatTime(ms) {
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	const s = Math.floor((ms % 60000) / 1000);
	const f = Math.round(ms % 1000);
	return h ? `${h}:${pad(m)}:${pad(s)}.${pad(f, 3)}` : `${m}:${pad(s)}.${pad(f, 3)}`;
}

// Gap to the leader: "+8.748" under a minute, "+1:05.471" above.
export function formatGap(ms) {
	if (ms < 60000) return `+${(ms / 1000).toFixed(3)}`;
	return `+${formatTime(ms)}`;
}

export function prefersReducedMotion() {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
