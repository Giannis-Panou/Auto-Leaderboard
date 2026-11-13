import { POINTS_SYSTEMS, TEAM_SCORERS } from './pointsSystems.js';

// Attach team/category info to parsed results.
export function enrichResults(results, teams, source) {
	return results.map((player) => {
		const teamEntry = teams.find((t) => t.username === player.username);
		return {
			...player,
			team: teamEntry?.team || '',
			category: teamEntry?.category || '',
			source,
		};
	});
}

// Merge several result files into one, re-ranking by time.
export function combineResults(resultsByFile) {
	if (resultsByFile.length === 1) return resultsByFile[0];

	return resultsByFile
		.flat()
		.sort((a, b) => a.time - b.time)
		.map((player, index) => ({ ...player, place: index + 1 }));
}

// Drivers without a team are listed as "Privateer" — that isn't a real team,
// so it never scores team points or appears in the team standings.
export function isRealTeam(team) {
	return Boolean(team) && team.trim().toLowerCase() !== 'privateer';
}

// Points earned in a single event, per driver and per team.
// Only the best `teamScorers` drivers of each team count towards the team.
export function scoreEvent(results, pointsSystemKey, teamScorersKey) {
	const pointsArray = POINTS_SYSTEMS[pointsSystemKey] || POINTS_SYSTEMS.WRC;
	const teamContr = TEAM_SCORERS[teamScorersKey] || 2;

	const driverPoints = {};
	const teamScores = {};

	results.forEach(({ place, username, team }) => {
		const points = pointsArray[place - 1] || 0;
		driverPoints[username] = (driverPoints[username] || 0) + points;
		if (isRealTeam(team)) (teamScores[team] ||= []).push(points);
	});

	const teamPoints = {};
	Object.entries(teamScores).forEach(([team, scores]) => {
		teamPoints[team] = scores
			.sort((a, b) => b - a)
			.slice(0, teamContr)
			.reduce((acc, score) => acc + score, 0);
	});

	return { driverPoints, teamPoints };
}

// Add an event's points onto existing standings.
export function addPoints(board, eventPoints) {
	const next = { ...board };
	Object.entries(eventPoints).forEach(([name, points]) => {
		next[name] = (next[name] || 0) + points;
	});
	return next;
}

export function zeroPoints(board) {
	return Object.fromEntries(Object.keys(board).map((name) => [name, 0]));
}

// Best time per driver for the latest event.
export function buildTimeLeaderboard(results) {
	const timeLeaderboard = {};
	results.forEach(({ username, time, timeStr, car, category, team }) => {
		if (!timeLeaderboard[username] || time < timeLeaderboard[username].time) {
			timeLeaderboard[username] = { time, timeStr, car, category, team };
		}
	});
	return timeLeaderboard;
}

// Group the latest event's results by category, ordered by place.
export function buildCategories(results) {
	const categories = {};
	results.forEach((player) => {
		if (!player.category) return;
		(categories[player.category] ||= []).push(player);
	});
	Object.values(categories).forEach((list) =>
		list.sort((a, b) => a.place - b.place)
	);
	return categories;
}

// Score each category's drivers as their own event: drivers are re-placed
// 1..n by their finishing order within the category, then scored with the
// same system. (Teams only score from the overall results.)
// Returns { [category]: { drivers: {name: pts} } }.
export function scoreCategories(results, pointsSystemKey) {
	return Object.fromEntries(
		Object.entries(buildCategories(results)).map(([cat, players]) => {
			const placed = players.map((p, i) => ({ ...p, place: i + 1 }));
			const { driverPoints } = scoreEvent(placed, pointsSystemKey);
			return [cat, { drivers: driverPoints }];
		})
	);
}

// Add one round's category scores onto the running category standings.
export function addCategoryPoints(standings, eventScores) {
	const next = { ...standings };
	Object.entries(eventScores).forEach(([cat, { drivers }]) => {
		next[cat] = { drivers: addPoints(next[cat]?.drivers || {}, drivers) };
	});
	return next;
}

export function zeroCategoryPoints(standings) {
	return Object.fromEntries(
		Object.entries(standings).map(([cat, { drivers = {} }]) => [
			cat,
			{ drivers: zeroPoints(drivers) },
		])
	);
}

export function sortByPointsDesc(board) {
	return Object.entries(board).sort((a, b) => b[1] - a[1]);
}

// { name: position } for a points board.
export function rankMap(board) {
	return Object.fromEntries(sortByPointsDesc(board).map(([name], i) => [name, i + 1]));
}
