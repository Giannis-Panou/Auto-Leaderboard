import { describe, expect, it } from 'vitest';
import { formatGap, formatPace, formatTime } from './format';
import { flagCode } from './countries';
import { normalizePlatform } from './platform';

describe('formatTime', () => {
	it('drops zero hours', () => {
		expect(formatTime(3565867)).toBe('59:25.867');
		expect(formatTime(4035867)).toBe('1:07:15.867');
		expect(formatTime(5007)).toBe('0:05.007');
	});
});

describe('formatGap', () => {
	it('shows seconds under a minute and m:ss above', () => {
		expect(formatGap(8748)).toBe('+8.748');
		expect(formatGap(65471)).toBe('+1:05.471');
	});
});

describe('formatPace', () => {
	it('shows one decimal', () => {
		expect(formatPace(103.26)).toBe('103.3%');
	});
});

describe('flagCode', () => {
	it('maps ISO alpha-3 and home-nation codes', () => {
		expect(flagCode('PRT')).toBe('pt');
		expect(flagCode('gbr')).toBe('gb');
		expect(flagCode('SCO')).toBe('gb-sct');
		expect(flagCode('CYM')).toBe('gb-wls');
		expect(flagCode('XYZ')).toBe('');
	});
});

describe('normalizePlatform', () => {
	it('maps Racenet and teams-file names', () => {
		expect(normalizePlatform('STEAM')).toBe('PC');
		expect(normalizePlatform('EA')).toBe('PC');
		expect(normalizePlatform('PlayStation')).toBe('PS');
		expect(normalizePlatform('XBOX')).toBe('XBOX');
		expect(normalizePlatform('')).toBe('');
	});
});
