// Results files say STEAM / EA / PSN / XBOX; teams files say PC / PlayStation / Xbox.
const ALIASES = {
	PC: ['pc', 'steam', 'ea', 'origin', 'epic'],
	PS: ['ps', 'psn', 'playstation', 'ps4', 'ps5'],
	XBOX: ['xbox', 'xb', 'xbl'],
};

export const PLATFORMS = [
	{ value: 'PC', label: 'PC' },
	{ value: 'PS', label: 'PlayStation' },
	{ value: 'XBOX', label: 'Xbox' },
];

export function normalizePlatform(raw = '') {
	const value = raw.trim().toLowerCase();
	if (!value) return '';
	return Object.keys(ALIASES).find((key) => ALIASES[key].includes(value)) || '';
}
