import { describe, expect, it } from 'vitest';
import { csvToJson, isTeamsFile, parseTime, teamCsvToJson, toCsv } from './csv';

describe('parseTime', () => {
	it('parses hh:mm:ss.fffffff (Racenet format)', () => {
		expect(parseTime('00:59:25.8670000')).toBe(3565867);
		expect(parseTime('01:07:14.9860000')).toBe(4034986);
	});

	it('parses mm:ss.fff and ss.fff, with dot or comma decimals', () => {
		expect(parseTime('4:30.336')).toBe(270336);
		expect(parseTime('12.5')).toBe(12500);
		expect(parseTime('12,5')).toBe(12500);
	});

	it('returns NaN for garbage', () => {
		expect(parseTime('DNF')).toBeNaN();
		expect(parseTime('1:2:3:4')).toBeNaN();
	});
});

describe('csvToJson', () => {
	const header = 'Rank,DisplayName,Vehicle,Time,DifferenceToFirst,Platform,';

	it('parses Racenet results rows', () => {
		const rows = csvToJson(`${header}\n1,Skoukerman,Ford Puma Rally1 HYBRID (2023),00:59:25.8670000,00:00:00,STEAM,`);
		expect(rows).toEqual([
			{
				place: 1,
				username: 'Skoukerman',
				car: 'Ford Puma Rally1 HYBRID (2023)',
				time: 3565867,
				timeStr: '00:59:25.8670000',
				platform: 'PC',
			},
		]);
	});

	it('handles quoted fields containing commas and CRLF line endings', () => {
		const rows = csvToJson(`${header}\r\n1,"Smith, Jr",Polo,00:01:00.000,00:00:00,PSN,\r\n`);
		expect(rows[0].username).toBe('Smith, Jr');
		expect(rows[0].car).toBe('Polo');
		expect(rows[0].platform).toBe('PS');
	});

	it('finds columns by header name when the layout differs', () => {
		const powerstage = 'Rank,DisplayName,Vehicle,Time,TimePenalty,DifferenceToFirst,Platform,\n1,loukasg6r,Yaris,00:04:30.3360000,00:00:00,00:00:00,XBOX,';
		expect(csvToJson(powerstage)[0]).toMatchObject({ username: 'loukasg6r', time: 270336, platform: 'XBOX' });
	});

	it('skips invalid rows', () => {
		const rows = csvToJson(`${header}\nx,Bad,Car,00:01:00.000\n2,,Car,00:01:00.000\n3,NoTime,Car,DNF\n4,Ok,Car,00:01:00.000`);
		expect(rows.map((r) => r.username)).toEqual(['Ok']);
	});

	it('returns [] for empty input', () => {
		expect(csvToJson('')).toEqual([]);
		expect(csvToJson(header)).toEqual([]);
	});
});

describe('teamCsvToJson', () => {
	it('reads the Crest teams layout by header name', () => {
		const csv = 'Name,RaceNet Name,NAT,Platform,Category,Team Name,Car,Car (Short)\nAdri Miguel,Nanooo450,prt,PlayStation,CA1,AZR Motorsport,Fabia,Fabia';
		expect(teamCsvToJson(csv)).toEqual([
			{ username: 'Nanooo450', name: 'Adri Miguel', team: 'AZR Motorsport', category: 'CA1', nat: 'PRT', platform: 'PS' },
		]);
	});

	it('falls back to fixed columns when headers are not recognised', () => {
		const csv = 'A,B,C,D,E,F\n1,driver1,x,y,CA2,Team One';
		expect(teamCsvToJson(csv)[0]).toMatchObject({ username: 'driver1', category: 'CA2', team: 'Team One' });
	});
});

describe('helpers', () => {
	it('detects teams files', () => {
		expect(isTeamsFile('teams.csv')).toBe(true);
		expect(isTeamsFile('dhc_TEAMS.csv')).toBe(true);
		expect(isTeamsFile('WRC2.csv')).toBe(false);
	});

	it('quotes CSV output where needed', () => {
		expect(toCsv([['Pos', 'Driver'], [1, 'Smith, Jr']])).toBe('Pos,Driver\r\n1,"Smith, Jr"');
	});
});
