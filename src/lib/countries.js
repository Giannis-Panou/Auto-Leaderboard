// 3-letter nationality codes (ISO 3166 alpha-3, plus the UK home nations used
// in motorsport) -> flag-icons file names.
const CODES = {
	ALB: 'al', AND: 'ad', ARE: 'ae', ARG: 'ar', ARM: 'am', AUS: 'au', AUT: 'at', AZE: 'az',
	BEL: 'be', BGR: 'bg', BIH: 'ba', BLR: 'by', BOL: 'bo', BRA: 'br', CAN: 'ca', CHE: 'ch',
	CHL: 'cl', CHN: 'cn', COL: 'co', CRI: 'cr', CYP: 'cy', CZE: 'cz', DEU: 'de', DNK: 'dk',
	DZA: 'dz', ECU: 'ec', EGY: 'eg', ESP: 'es', EST: 'ee', FIN: 'fi', FRA: 'fr', GEO: 'ge',
	GRC: 'gr', HKG: 'hk', HRV: 'hr', HUN: 'hu', IDN: 'id', IND: 'in', IRL: 'ie', IRN: 'ir',
	ISL: 'is', ISR: 'il', ITA: 'it', JPN: 'jp', KAZ: 'kz', KEN: 'ke', KOR: 'kr', LBN: 'lb',
	LTU: 'lt', LUX: 'lu', LVA: 'lv', MAR: 'ma', MCO: 'mc', MDA: 'md', MDG: 'mg', MEX: 'mx',
	MKD: 'mk', MLT: 'mt', MNE: 'me', MYS: 'my', NLD: 'nl', NOR: 'no', NZL: 'nz', PAK: 'pk',
	PER: 'pe', PHL: 'ph', POL: 'pl', PRT: 'pt', PRY: 'py', QAT: 'qa', ROU: 'ro', RUS: 'ru',
	SAU: 'sa', SGP: 'sg', SRB: 'rs', SVK: 'sk', SVN: 'si', SWE: 'se', THA: 'th', TUN: 'tn',
	TUR: 'tr', TWN: 'tw', UKR: 'ua', URY: 'uy', USA: 'us', VEN: 've', VNM: 'vn', ZAF: 'za',
	GBR: 'gb', UK: 'gb',
	ENG: 'gb-eng', SCO: 'gb-sct', NIR: 'gb-nir', WAL: 'gb-wls', WLS: 'gb-wls',
	// CYM is ISO for the Cayman Islands, but in rally entry lists it's Wales (Cymru).
	CYM: 'gb-wls',
};

export function flagCode(nat = '') {
	return CODES[nat.trim().toUpperCase()] || '';
}
