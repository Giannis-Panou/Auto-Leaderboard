import { useEffect, useState } from 'react';

// Tiny hash router for the profile pages: #/driver/<name> and #/team/<name>.
// Hash routes need no server config (Netlify serves index.html as-is), the
// browser back button works, and profiles can be linked to directly.

export const driverHref = (name) => `#/driver/${encodeURIComponent(name)}`;
export const teamHref = (name) => `#/team/${encodeURIComponent(name)}`;

export function parseRoute(hash) {
	const match = hash.match(/^#\/(driver|team)\/(.+)$/);
	if (!match) return null;
	try {
		return { page: match[1], name: decodeURIComponent(match[2]) };
	} catch {
		return null;
	}
}

// How many in-app page changes happened, so "Back" only uses history when
// the previous entry is part of the app (not when a profile link was opened directly).
let inAppNavigations = 0;

export function navigate(href) {
	window.location.hash = href;
}

// Leave any profile page for the main app (clean URL, new history entry).
export function goHome() {
	window.history.pushState(null, '', window.location.pathname + window.location.search);
	window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function goBack() {
	if (inAppNavigations > 0) window.history.back();
	else goHome();
}

export function useHashRoute() {
	const [route, setRoute] = useState(() => parseRoute(window.location.hash));

	useEffect(() => {
		const onChange = () => {
			const next = parseRoute(window.location.hash);
			inAppNavigations = next ? inAppNavigations + 1 : Math.max(0, inAppNavigations - 1);
			setRoute(next); // scroll position is handled by the app (restored when leaving a profile)
		};
		window.addEventListener('hashchange', onChange);
		return () => window.removeEventListener('hashchange', onChange);
	}, []);

	return route;
}
