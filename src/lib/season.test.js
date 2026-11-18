import { describe, expect, it } from 'vitest';
import {
	computeSeason,
	driverSummary,
	headToHead,
	teamHeadToHead,
	teamSummary,
	isRealTeam,
	mergeRoundFiles,
	rankMap,
	roundFingerprint,
	scoreRound,
} from './season';

const settings = { pointsSystem: 'WRC', teamScorers: 'Two', dnfCutoff: 200 };
const row = (username, seconds, extra = {}) => ({
	username,
	car: 'Car',
	time: seconds * 1000,
	timeStr: `${seconds}`,
	...extra,
});
const round = (id, results) => ({ id, name: id, results });

const teamsByUser = {
	ana: { team: 'Red', category: 'CA1' },
	ben: { team: 'Red', category: 'CA2' },
	cat: { team: 'Blue', category: 'CA1' },
	dan: { team: 'Red', category: 'CA2' },
	eve: { team: 'Privateer', category: 'CA2' },
};

describe('mergeRoundFiles', () => {
	it('keeps each driver once with their best time, fastest first', () => {
		const merged = mergeRoundFiles([
			{ name: 'Rally2.csv', rows: [row('ana', 100), row('ben', 90)] },
			{ name: 'WRC2.csv', rows: [row('ana', 80)] },
		]);
		expect(merged.map((r) => [r.username, r.time, r.source])).toEqual([
			['ana', 80000, 'WRC2.csv'],
			['ben', 90000, 'Rally2.csv'],
		]);
	});
});

describe('roundFingerprint', () => {
	it('is order-independent and changes with the results', () => {
		const a = [row('ana', 1), row('ben', 2)];
		expect(roundFingerprint(a)).toBe(roundFingerprint([...a].reverse()));
		expect(roundFingerprint(a)).not.toBe(roundFingerprint([row('ana', 1), row('ben', 3)]));
	});
});

describe('scoreRound', () => {
	const scored = scoreRound(
		round('r1', [row('ana', 100), row('ben', 110), row('cat', 120), row('dan', 130), row('eve', 250)]),
		teamsByUser,
		settings
	);
	const byName = Object.fromEntries(scored.entries.map((e) => [e.username, e]));

	it('awards points by overall place', () => {
		expect(scored.driverPoints).toMatchObject({ ana: 25, ben: 17, cat: 15, dan: 12 });
	});

	it('marks drivers over the DNF cut-off and gives them no place or points', () => {
		expect(byName.eve).toMatchObject({ dnf: true, place: null, points: 0 });
		expect(scored.driverPoints.eve).toBe(0);
	});

	it('scores categories on in-category finishing order', () => {
		expect(byName.ben.categoryPlace).toBe(1);
		expect(byName.dan.categoryPlace).toBe(2);
		expect(scored.categoryPoints.CA2).toEqual({ ben: 25, dan: 17, eve: 0 });
		expect(scored.categoryPoints.CA1).toEqual({ ana: 25, cat: 17 });
	});

	it('counts only the best N team scorers and ignores Privateers', () => {
		// Red: ana 25 + ben 17 (dan's 12 doesn't count with 2 scorers)
		expect(scored.teamPoints).toEqual({ Red: 42, Blue: 15 });
	});

	it('does not mark DNFs when the cut-off is off', () => {
		const noCutoff = scoreRound(round('r', [row('ana', 100), row('eve', 900)]), teamsByUser, { ...settings, dnfCutoff: 0 });
		expect(noCutoff.entries[1]).toMatchObject({ dnf: false, place: 2 });
	});
});

describe('computeSeason', () => {
	const rounds = [
		round('r1', [row('ana', 100), row('ben', 110)]),
		round('r2', [row('ben', 100), row('ana', 110)]),
	];

	it('totals all rounds', () => {
		const season = computeSeason(rounds, teamsByUser, settings);
		expect(season.standings.drivers).toEqual({ ana: 42, ben: 42 });
		expect(season.previous.drivers).toEqual({ ana: 25, ben: 17 });
	});

	it('has no previous standings with a single round', () => {
		expect(computeSeason(rounds.slice(0, 1), teamsByUser, settings).previous).toBeNull();
	});

	it('re-scores every round when the points system changes', () => {
		const f1 = computeSeason(rounds, teamsByUser, { ...settings, pointsSystem: 'F1' });
		expect(f1.standings.drivers).toEqual({ ana: 43, ben: 43 });
	});
});

describe('driverSummary', () => {
	it('summarises a driver across rounds', () => {
		const season = computeSeason(
			[
				round('r1', [row('ana', 100), row('ben', 110)]),
				round('r2', [row('ben', 100)]),
				round('r3', [row('ana', 100), row('ben', 300)]),
			],
			teamsByUser,
			settings
		);
		const ben = driverSummary(season, 'ben');
		expect(ben).toMatchObject({ starts: 3, dnfs: 1, wins: 1, podiums: 2, bestFinish: 1 });
		expect(ben.perRound.map((r) => r.cumulative)).toEqual([17, 42, 42]);
		// ben is the only CA2 driver in each round, so wins the category every time he finishes
		expect(ben.perRound.map((r) => r.categoryCumulative)).toEqual([25, 50, 50]);
		expect(ben.avgPace).toBeCloseTo(105);
	});
});

describe('teamSummary / teamHeadToHead', () => {
	const season = computeSeason(
		[
			// Red: ana 25 + ben 17 count (dan 12 doesn't, 2 scorers); Blue: cat 15
			round('r1', [row('ana', 100), row('ben', 110), row('cat', 120), row('dan', 130)]),
			// Red: dan 25 + ana 15; Blue: cat 17
			round('r2', [row('dan', 100), row('cat', 110), row('ana', 120)]),
		],
		teamsByUser,
		settings
	);

	it('records which drivers counted for the team each round', () => {
		expect(season.rounds[0].teamScorers.Red).toEqual(['ana', 'ben']);
		expect(season.rounds[1].teamScorers.Red).toEqual(['dan', 'ana']);
	});

	it('summarises a team across rounds', () => {
		const red = teamSummary(season, 'Red');
		expect(red).toMatchObject({ pos: 1, points: 82, starts: 2, roundWins: 2, teamCount: 2 });
		expect(red.perRound.map((r) => r.cumulative)).toEqual([42, 82]);
		expect(red.contributions).toEqual({ ana: 40, ben: 17, dan: 25 });
		expect(red.members.sort()).toEqual(['ana', 'ben', 'dan']);
		expect(red.bestRound).toEqual({ name: 'r1', points: 42 });
	});

	it('counts rounds each team outscored the other', () => {
		expect(teamHeadToHead(season, 'Red', 'Blue')).toEqual({ a: 2, b: 0 });
	});
});

describe('headToHead', () => {
	it('counts rounds where both finished, by who placed higher', () => {
		const season = computeSeason(
			[
				round('r1', [row('ana', 100), row('ben', 110)]),
				round('r2', [row('ben', 100), row('ana', 110)]),
				round('r3', [row('ben', 100), row('ana', 110)]),
				round('r4', [row('ana', 100)]), // ben absent
				round('r5', [row('ana', 100), row('ben', 300)]), // ben DNF
			],
			teamsByUser,
			settings
		);
		expect(headToHead(season, 'ana', 'ben')).toEqual({ a: 1, b: 2 });
	});
});

describe('helpers', () => {
	it('treats Privateer as no team', () => {
		expect(isRealTeam('Privateer')).toBe(false);
		expect(isRealTeam(' privateer ')).toBe(false);
		expect(isRealTeam('')).toBe(false);
		expect(isRealTeam('Red')).toBe(true);
	});

	it('ranks a board by points', () => {
		expect(rankMap({ a: 5, b: 9, c: 1 })).toEqual({ b: 1, a: 2, c: 3 });
	});
});
