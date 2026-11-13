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

function dataLines(csv) {
	return csv
		.split('\n')
		.filter((line) => line.trim() !== '')
		.slice(1);
}

// Results CSV -> [{ place, username, car, time, timeStr }]
export function csvToJson(csv) {
	return dataLines(csv).flatMap((line) => {
		const values = line.split(',').map((val) => val.trim());
		if (values.length < 4) return [];

		const place = parseInt(values[0], 10);
		const [, username, car, timeStr] = values;
		if (isNaN(place) || !username || !car || !timeStr) return [];

		const time = parseTime(timeStr);
		if (isNaN(time) || time <= 0) return [];

		return { place, username, car, time, timeStr };
	});
}

// Teams CSV -> [{ username, team, category }]
export function teamCsvToJson(csv) {
	return dataLines(csv).flatMap((line) => {
		const values = line.split(',');
		if (values.length < 2) return [];

		return {
			username: values[1].trim(),
			team: (values[5] || '').trim(),
			category: (values[4] || '').trim(),
		};
	});
}

export function isTeamsFile(name) {
	return name.includes('teams.csv');
}
