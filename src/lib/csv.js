import Papa from 'papaparse';
import { normalizePlatform } from './platform.js';

// Parse a time string ("hh:mm:ss.fff", "mm:ss.fff" or "ss.fff") into milliseconds.
// Returns NaN when the string can't be parsed.
export function parseTime(timeStr) {
	const msPart = (ms) => parseInt((ms || '0').padEnd(3, '0').slice(0, 3)) || 0;

	if (timeStr.includes(':')) {
		const parts = timeStr.split(':');

		if (parts.length === 3) {
			const [hours, minutes, seconds] = parts;
			const [sec, ms] = seconds.split(/[.,]/);
			return (
				parseInt(hours) * 3600000 +
				parseInt(minutes) * 60000 +
				parseInt(sec) * 1000 +
				msPart(ms)
			);
		}

		if (parts.length === 2) {
			const [minutes, seconds] = parts;
			const [sec, ms] = seconds.split(/[.,]/);
			return parseInt(minutes) * 60000 + parseInt(sec) * 1000 + msPart(ms);
		}

		return NaN;
	}

	if (/^\d+[.,]\d+$/.test(timeStr)) {
		return Math.round(parseFloat(timeStr.replace(',', '.')) * 1000);
	}

	return NaN;
}

// Proper CSV parsing (quoted fields, commas inside quotes, CRLF).
function parseRows(text) {
	return Papa.parse(text.replace(/^﻿/, '').trim(), { skipEmptyLines: 'greedy' }).data;
}

// Find a column by header name, falling back to a fixed position for files
// whose headers don't match (e.g. translated headers).
function columnIndex(header, names, fallback) {
	const index = header.findIndex((h) => names.includes(String(h).trim().toLowerCase()));
	return index >= 0 ? index : fallback;
}

const cell = (values, index) => (index >= 0 ? String(values[index] ?? '').trim() : '');

// Results CSV -> [{ place, username, car, time, timeStr, platform }]
export function csvToJson(csv) {
	const [header = [], ...rows] = parseRows(csv);
	const col = {
		place: columnIndex(header, ['rank', 'position', 'pos'], 0),
		username: columnIndex(header, ['displayname', 'driver', 'username'], 1),
		car: columnIndex(header, ['vehicle', 'car'], 2),
		time: columnIndex(header, ['time'], 3),
		platform: columnIndex(header, ['platform'], -1),
	};

	return rows.flatMap((values) => {
		const place = parseInt(cell(values, col.place), 10);
		const username = cell(values, col.username);
		const car = cell(values, col.car);
		const timeStr = cell(values, col.time);
		if (isNaN(place) || !username || !car || !timeStr) return [];

		const time = parseTime(timeStr);
		if (isNaN(time) || time <= 0) return [];

		return { place, username, car, time, timeStr, platform: normalizePlatform(cell(values, col.platform)) };
	});
}

// Teams CSV -> [{ username, name, team, category, nat, platform }]
export function teamCsvToJson(csv) {
	const [header = [], ...rows] = parseRows(csv);
	const col = {
		name: columnIndex(header, ['name'], -1),
		username: columnIndex(header, ['racenet name', 'displayname', 'username'], 1),
		nat: columnIndex(header, ['nat', 'nationality', 'country'], -1),
		platform: columnIndex(header, ['platform'], -1),
		category: columnIndex(header, ['category'], 4),
		team: columnIndex(header, ['team name', 'team'], 5),
	};

	return rows.flatMap((values) => {
		// No Racenet name: key the entry by real name, which league sheets use.
		const username = cell(values, col.username) || cell(values, col.name);
		if (!username) return [];
		return {
			username,
			name: cell(values, col.name),
			team: cell(values, col.team),
			category: cell(values, col.category),
			nat: cell(values, col.nat).toUpperCase(),
			platform: normalizePlatform(cell(values, col.platform)),
		};
	});
}

export function isTeamsFile(name) {
	return name.toLowerCase().includes('teams.csv');
}

const headerSet = (row) => new Set(row.map((h) => String(h).trim().toLowerCase()));
const stageHeaderIndex = (rows) =>
	rows.findIndex((row) => {
		const h = headerSet(row);
		return h.has('cat pos') && (h.has('driver') || h.has('real driver')) && h.has('rally time');
	});

// What a CSV holds, judged by its headers rather than its file name:
// 'teams' (an entry list), 'stages' (a league stage-by-stage sheet) or 'results' (Racenet).
export function detectCsvKind(text, name = '') {
	if (isTeamsFile(name)) return 'teams';
	const rows = parseRows(text).slice(0, 10);
	if (stageHeaderIndex(rows) >= 0) return 'stages';
	const first = headerSet(rows[0] || []);
	if (first.has('racenet name') || (first.has('team name') && first.has('category'))) return 'teams';
	return 'results';
}

// Names written by hand differ in case, spacing and accent encoding.
export const nameKey = (name) => String(name).normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();

// League stage sheet -> the same rows as csvToJson, plus team, category and
// retirements. The sheet has one block of columns per stage (SS 1 … SPS 2),
// each sorted on its own; the last block holds the final rally times.
// Drivers are matched to the teams list by real name to get their Racenet name;
// anyone not in it keeps their real name and the sheet's team and category.
export function stageSheetToJson(csv, teams = []) {
	const rows = parseRows(csv);
	const h = stageHeaderIndex(rows);
	if (h < 0) return [];
	const header = rows[h].map((c) => String(c).trim().toLowerCase());
	const starts = header.flatMap((c, i) => (c === 'cat pos' ? [i] : []));
	const titles = rows[h - 1] || [];

	const blocks = starts.map((start, b) => {
		const end = starts[b + 1] ?? header.length;
		const find = (...names) => {
			const i = header.slice(start, end).findIndex((c) => names.includes(c));
			return i >= 0 ? start + i : -1;
		};
		return {
			stage: cell(titles, start) || `Stage ${b + 1}`,
			// Some sheets label these REAL DRIVER / SIM DRIVER; the "sim driver"
			// column still holds the team name.
			driver: find('driver', 'real driver'),
			team: find('team', 'sim driver'),
			category: find('category'),
			car: find('car'),
			rallyTime: find('rally time'),
		};
	});

	// Follow every driver through the stages; the last block they appear in with
	// a rally time is how far they got.
	const drivers = new Map();
	rows.slice(h + 1).forEach((values) =>
		blocks.forEach((block, b) => {
			const name = cell(values, block.driver);
			const timeStr = cell(values, block.rallyTime);
			const time = timeStr ? parseTime(timeStr) : NaN;
			if (!name || isNaN(time) || time <= 0) return;
			if (drivers.get(name)?.lastBlock > b) return;
			drivers.set(name, {
				name,
				team: cell(values, block.team),
				category: cell(values, block.category).toUpperCase(),
				car: cell(values, block.car),
				time,
				timeStr,
				lastBlock: b,
			});
		})
	);

	const byName = new Map(teams.filter((t) => t.name).map((t) => [nameKey(t.name), t]));
	const lastBlock = blocks.length - 1;
	const results = [...drivers.values()].map((d) => {
		const known = byName.get(nameKey(d.name));
		const row = {
			username: known?.username || d.name,
			car: d.car,
			time: d.time,
			timeStr: d.timeStr,
			platform: '',
			team: d.team,
			category: d.category,
		};
		if (d.lastBlock < lastBlock) {
			row.retired = true;
			row.retiredAfter = blocks[d.lastBlock].stage;
		}
		return row;
	});

	let place = 0;
	return results
		.sort((a, b) => Boolean(a.retired) - Boolean(b.retired) || a.time - b.time)
		.map((r) => (r.retired ? { place: null, ...r } : { place: ++place, ...r }));
}

// Rows of plain values -> CSV text (quotes anything that needs it).
export function toCsv(rows) {
	return Papa.unparse(rows);
}
