// Ends the start-lights loading screen in index.html. It always plays the
// whole sequence: all five lights on, a short pause, lights out with "Go",
// then the app. Timing (≈1.7s total):
//   lights 1–5 come on over ~0.8s (CSS in index.html)
//   hold all red        250ms
//   lights out / "Go"   300ms
//   fade into the app   450ms
const HOLD_RED = 250;
const HOLD_GO = 300;
const FADE = 450;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolves once the fifth light's animation has finished (flag set by an
// inline script in index.html, in case it finished before this code loaded).
function lightsOn(splash) {
	if (window.__splashLightsOn) return Promise.resolve();
	const last = splash.querySelector('.splash-light:last-child');
	return new Promise((resolve) => {
		last?.addEventListener('animationend', resolve, { once: true });
		wait(2000).then(resolve); // fallback if the animation never runs
	});
}

// Marks the page ready: the header's brand mark and race stripe animate in
// on this class, so they play right after the lights go out.
const markReady = () => document.documentElement.classList.add('app-ready');

export async function hideSplash() {
	const splash = document.getElementById('splash');
	if (!splash) {
		markReady();
		return;
	}

	// Reduced motion: no light show, just get out of the way.
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
		splash.remove();
		markReady();
		return;
	}

	const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(3000)]);
	await Promise.all([lightsOn(splash), fontsReady]);
	await wait(HOLD_RED);

	splash.classList.add('lights-out');
	const status = splash.querySelector('.splash-status');
	if (status) status.textContent = 'Go';
	await wait(HOLD_GO);

	splash.classList.add('is-done');
	markReady();
	await wait(FADE + 100);
	splash.remove();
}
