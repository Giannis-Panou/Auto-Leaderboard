// Ends the start-lights loading screen in index.html once the app has
// rendered and the WRC font is ready. The first visit in a session waits for
// all five lights; later reloads (or reduced motion) skip straight to the app.
const LIGHTS_DURATION = 1000; // ms until the fifth light is on
const LIGHTS_OUT_HOLD = 300; // ms the "GO" state shows before fading

export function hideSplash() {
	const splash = document.getElementById('splash');
	if (!splash) return;

	const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	let seen = false;
	try {
		seen = sessionStorage.getItem('splash-seen') === '1';
		sessionStorage.setItem('splash-seen', '1');
	} catch {
		// storage unavailable: just show the full sequence
	}
	const quick = reduced || seen;

	// performance.now() counts from page start, so time already spent loading counts.
	const remaining = quick ? 0 : Math.max(0, LIGHTS_DURATION - performance.now());
	const fontsReady = document.fonts?.ready ?? Promise.resolve();
	const timeout = new Promise((resolve) => setTimeout(resolve, 3000)); // don't wait forever on fonts

	Promise.all([Promise.race([fontsReady, timeout]), new Promise((r) => setTimeout(r, remaining))]).then(() => {
		splash.classList.add('lights-out');
		const status = splash.querySelector('.splash-status');
		if (status) status.textContent = 'Go';

		setTimeout(
			() => {
				splash.classList.add('is-done');
				setTimeout(() => splash.remove(), 600);
			},
			quick ? 0 : LIGHTS_OUT_HOLD
		);
	});
}
