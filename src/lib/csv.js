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
		const username = cell(values, col.username);
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

// Rows of plain values -> CSV text (quotes anything that needs it).
export function toCsv(rows) {
	return Papa.unparse(rows);
}
