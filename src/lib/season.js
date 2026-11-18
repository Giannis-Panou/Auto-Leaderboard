import { POINTS_SYSTEMS, TEAM_SCORERS } from './pointsSystems.js';

// Standings are never stored — every loaded round is kept and the season is
// recomputed from them, so changing a setting or removing a round re-scores
// everything consistently.

export const DEFAULT_SETTINGS = {
	pointsSystem: 'WRC',
	teamScorers: 'Two',
	dnfCutoff: 200, // % of the winner's time; slower counts as DNF. 0 = off
};

export const DNF_OPTIONS = [
	{ value: 0, label: 'Off' },
	{ value: 150, label: '150% of winner' },
	{ value: 200, label: '200% of winner' },
	{ value: 300, label: '300% of winner' },
];

// Drivers without a team are listed as "Privateer" — that isn't a real team,
// so it never scores team points or appears in the team standings.
export function isRealTeam(team) {
	return Boolean(team) && team.trim().toLowerCase() !== 'privateer';
}

// Merge a round's files (e.g. Rally2.csv + WRC2.csv) into one entry per
// driver, keeping their best time, ordered fastest first.
export function mergeRoundFiles(files) {
	const best = new Map();
	files.forEach(({ name, rows }) =>
		rows.forEach(({ username, car, time, timeStr, platform = '' }) => {
			const current = best.get(username);
			if (!current || time < current.time) {
				best.set(username, { username, car, time, timeStr, platform, source: name });
			}
		})
	);
	return [...best.values()].sort((a, b) => a.time - b.time);
}

// Short stable hash of a round's results, used to refuse duplicate loads.
export function roundFingerprint(results) {
	const text = results
		.map((r) => `${r.username}:${r.time}`)
		.sort()
		.join('|');
	let hash = 5381;
	for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
	return `${results.length}-${(hash >>> 0).toString(36)}`;
}

// Score one round. Overall places and category places are both counted
// among finishers only; DNFs (slower than the cut-off) score nothing.
export function scoreRound(round, teamsByUser, settings = DEFAULT_SETTINGS) {
	const pointsArray = POINTS_SYSTEMS[settings.pointsSystem] || POINTS_SYSTEMS.WRC;
	const teamContr = TEAM_SCORERS[settings.teamScorers] || 2;
	const rows = [...round.results].sort((a, b) => a.time - b.time);
	const winnerTime = rows[0]?.time;

	let place = 0;
	const categoryCount = {};
	const entries = rows.map((row) => {
		const info = teamsByUser[row.username] || {};
		const pct = (row.time / winnerTime) * 100;
		const dnf = settings.dnfCutoff > 0 && pct > settings.dnfCutoff;
		const entry = {
			...row,
			team: info.team || '',
			category: info.category || '',
			pct,
			dnf,
			place: null,
			categoryPlace: null,
			points: 0,
			categoryPoints: 0,
		};
		if (!dnf) {
			entry.place = ++place;
			entry.points = pointsArray[entry.place - 1] || 0;
			if (entry.category) {
				entry.categoryPlace = categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
				entry.categoryPoints = pointsArray[entry.categoryPlace - 1] || 0;
			}
		}
		return entry;
	});

	const driverPoints = {};
	const categoryPoints = {};
	const teamScores = {};
	entries.forEach((e) => {
		driverPoints[e.username] = e.points;
		if (e.category) (categoryPoints[e.category] ||= {})[e.username] = e.categoryPoints;
		if (isRealTeam(e.team)) (teamScores[e.team] ||= []).push({ username: e.username, points: e.points });
	});

	// Team score = best `teamContr` drivers; remember who counted.
	const teamPoints = {};
	const teamScorers = {};
	Object.entries(teamScores).forEach(([team, scores]) => {
		const counted = scores.sort((a, b) => b.points - a.points).slice(0, teamContr);
		teamPoints[team] = counted.reduce((sum, s) => sum + s.points, 0);
		teamScorers[team] = counted.map((s) => s.username);
	});

	return { ...round, entries, driverPoints, teamPoints, teamScorers, categoryPoints };
}

const addInto = (target, points) => {
	Object.entries(points).forEach(([name, p]) => {
		target[name] = (target[name] || 0) + p;
	});
};

function totals(scoredRounds) {
	const drivers = {};
	const teams = {};
	const categories = {};
	scoredRounds.forEach((r) => {
		addInto(drivers, r.driverPoints);
		addInto(teams, r.teamPoints);
		Object.entries(r.categoryPoints).forEach(([cat, points]) => addInto((categories[cat] ||= {}), points));
	});
	return { drivers, teams, categories };
}

// Score every round and total them. `previous` is the standings before the
// latest round (null until there are two rounds), for ▲/▼ arrows.
export function computeSeason(rounds, teamsByUser, settings = DEFAULT_SETTINGS) {
	const scored = rounds.map((r) => scoreRound(r, teamsByUser, settings));
	return {
		rounds: scored,
		standings: totals(scored),
		previous: scored.length > 1 ? totals(scored.slice(0, -1)) : null,
	};
}

// Everything the team page needs about one team's season.
export function teamSummary(season, team) {
	const realTeams = Object.fromEntries(Object.entries(season.standings.teams).filter(([t]) => isRealTeam(t)));
	const contributions = {}; // username -> points that counted for the team
	const members = new Set();
	let cumulative = 0;

	const perRound = season.rounds.map((round) => {
		const roster = round.entries.filter((e) => e.team === team);
		roster.forEach((e) => members.add(e.username));
		const points = round.teamPoints[team];
		const scorers = round.teamScorers?.[team] || [];
		scorers.forEach((name) => {
			const entry = roster.find((e) => e.username === name);
			contributions[name] = (contributions[name] || 0) + (entry?.points || 0);
		});
		cumulative += points || 0;
		const roundRanks = rankMap(Object.fromEntries(Object.entries(round.teamPoints).filter(([t]) => isRealTeam(t))));
		return {
			id: round.id,
			name: round.name,
			started: roster.length > 0,
			points: points ?? null,
			roundPos: points === undefined ? null : roundRanks[team],
			drivers: roster.length,
			scorers,
			cumulative,
		};
	});

	const started = perRound.filter((r) => r.started);
	const best = started.reduce((top, r) => (!top || r.points > top.points ? r : top), null);
	return {
		team,
		pos: rankMap(realTeams)[team],
		points: realTeams[team] || 0,
		teamCount: Object.keys(realTeams).length,
		perRound,
		members: [...members],
		contributions,
		starts: started.length,
		roundWins: started.filter((r) => r.roundPos === 1).length,
		roundPodiums: started.filter((r) => r.roundPos && r.roundPos <= 3).length,
		bestRound: best && { name: best.name, points: best.points },
		avgPoints: started.length ? started.reduce((sum, r) => sum + r.points, 0) / started.length : null,
	};
}

// Rounds where both teams scored: how often each one outscored the other.
export function teamHeadToHead(season, a, b) {
	let aAhead = 0;
	let bAhead = 0;
	season.rounds.forEach((round) => {
		const pa = round.teamPoints[a];
		const pb = round.teamPoints[b];
		if (pa === undefined || pb === undefined || pa === pb) return;
		if (pa > pb) aAhead++;
		else bAhead++;
	});
	return { a: aAhead, b: bAhead };
}

// Rounds where both drivers finished: how often each one beat the other.
export function headToHead(season, a, b) {
	let aAhead = 0;
	let bAhead = 0;
	season.rounds.forEach((round) => {
		const ea = round.entries.find((e) => e.username === a);
		const eb = round.entries.find((e) => e.username === b);
		if (!ea || !eb || ea.dnf || eb.dnf) return;
		if (ea.place < eb.place) aAhead++;
		else bAhead++;
	});
	return { a: aAhead, b: bAhead };
}

export function sortByPointsDesc(board) {
	return Object.entries(board).sort((a, b) => b[1] - a[1]);
}

// { name: position } for a points board.
export function rankMap(board) {
	return Object.fromEntries(sortByPointsDesc(board).map(([name], i) => [name, i + 1]));
}

// Everything the driver page needs about one driver's season.
export function driverSummary(season, username) {
	let cumulative = 0;
	let categoryCumulative = 0;
	const perRound = season.rounds.map((round) => {
		const entry = round.entries.find((e) => e.username === username) || null;
		cumulative += entry?.points || 0;
		categoryCumulative += entry?.categoryPoints || 0;
		return { id: round.id, name: round.name, entry, cumulative, categoryCumulative };
	});

	const started = perRound.filter((r) => r.entry);
	const finished = started.filter((r) => !r.entry.dnf);
	const places = finished.map((r) => r.entry.place);

	return {
		perRound,
		starts: started.length,
		dnfs: started.length - finished.length,
		wins: places.filter((p) => p === 1).length,
		podiums: places.filter((p) => p <= 3).length,
		bestFinish: places.length ? Math.min(...places) : null,
		avgPace: finished.length
			? finished.reduce((sum, r) => sum + r.entry.pct, 0) / finished.length
			: null,
	};
}
