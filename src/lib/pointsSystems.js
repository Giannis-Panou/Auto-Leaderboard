// Points awarded per finishing position
export const POINTS_SYSTEMS = {
	WRC: [25, 17, 15, 12, 10, 8, 6, 4, 2, 1],
	WRC_Powerstage: [5, 4, 3, 2, 1],
	Rallycross: [20, 16, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
	F1: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
	F1_Sprint: [8, 7, 6, 5, 4, 3, 2, 1],
	Crest: [
		100, 98, 96, 94, 92, 90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64,
		62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26,
		24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
		1,
	],
};

export const POINTS_SYSTEM_OPTIONS = [
	{ value: 'WRC', label: 'WRC' },
	{ value: 'WRC_Powerstage', label: 'WRC Powerstage' },
	{ value: 'Rallycross', label: 'Rallycross' },
	{ value: 'F1', label: 'F1' },
	{ value: 'F1_Sprint', label: 'F1 Sprint' },
	{ value: 'Crest', label: 'Crest' },
];

// Points contributors per team
export const TEAM_SCORERS = {
	Two: 2,
	Three: 3,
	Four: 4,
};

export const TEAM_SCORER_OPTIONS = [
	{ value: 'Two', label: '2 Drivers' },
	{ value: 'Three', label: '3 Drivers' },
	{ value: 'Four', label: '4 Drivers' },
];

export const CATEGORIES = ['CA1', 'CA2', 'CA3', 'CA4'];
