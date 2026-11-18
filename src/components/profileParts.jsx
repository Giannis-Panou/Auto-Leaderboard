import { driverSummary, isRealTeam, rankMap, sortByPointsDesc } from '../lib/season';

// Shared bits for the profile pages and the inline compare panels.

export const place = (p) => (p ? `P${p}` : '–');
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function Stat({ label, value, detail }) {
	return (
		<div className="stat">
			<span className="stat-label">{label}</span>
			<span className="stat-value">{value}</span>
			{detail && <span className="stat-detail">{detail}</span>}
		</div>
	);
}

// Everything shown about one driver, ready for display.
export function driverProfile(season, teamsByUser, username) {
	const info = teamsByUser[username] || {};
	const category = info.category;
	const categoryBoard = (category && season.standings.categories[category]) || {};
	return {
		username,
		info,
		category,
		summary: driverSummary(season, username),
		pos: rankMap(season.standings.drivers)[username],
		points: season.standings.drivers[username] || 0,
		categoryPos: rankMap(categoryBoard)[username],
		categoryPoints: categoryBoard[username] || 0,
	};
}

export const realTeamBoard = (season) =>
	Object.fromEntries(Object.entries(season.standings.teams).filter(([t]) => isRealTeam(t)));

// The natural rival on a points board: whoever is just ahead (or, for the
// leader, just behind).
export function rivalOf(board, name) {
	const order = sortByPointsDesc(board).map(([n]) => n);
	const i = order.indexOf(name);
	if (i < 0) return order.find((n) => n !== name) || '';
	return order[i - 1] ?? order[i + 1] ?? '';
}

// The neighbours either side of a name on a points board, with the gaps.
export function neighbours(board, name) {
	const order = sortByPointsDesc(board);
	const i = order.findIndex(([n]) => n === name);
	if (i < 0) return {};
	const points = order[i][1];
	const ahead = order[i - 1] && { name: order[i - 1][0], gap: order[i - 1][1] - points };
	const behind = order[i + 1] && { name: order[i + 1][0], gap: points - order[i + 1][1] };
	return { ahead, behind };
}

// "trails X by 16 pts" / "leads X by 4 pts" / "level on points with X"
export function gapSentence(aPoints, bPoints) {
	const diff = aPoints - bPoints;
	if (diff === 0) return { verb: 'level on points with', amount: '' };
	return { verb: diff > 0 ? 'leads' : 'trails', amount: `by ${Math.abs(diff)} pts` };
}

export function CompareSelect({ label, value, options, onChange }) {
	return (
		<label className="compare-select">
			<span className="field-label">{label}</span>
			<span className="select-wrap">
				<select value={value} onChange={(e) => onChange(e.target.value)}>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</span>
		</label>
	);
}
