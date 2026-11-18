import { useMemo, useState } from 'react';
import { CloseIcon } from './Icons';
import { Flag } from './DriverMeta';
import { ProfileLink } from './Leaderboard';
import PointsChart, { SERIES_COLORS } from './PointsChart';
import Tabs from './Tabs';
import { CompareSelect, driverProfile, gapSentence, place, plural, rivalOf } from './profileParts';
import { driverHref } from '../hooks/useHashRoute';
import { formatPace } from '../lib/format';
import { headToHead, rankMap, sortByPointsDesc } from '../lib/season';

function Swatch({ i }) {
	return <span className="legend-swatch" style={{ background: SERIES_COLORS[i] }} />;
}

// Who was ahead in one round: the better finisher, or whoever started/finished.
function roundAhead(ea, eb) {
	if (!ea && !eb) return null;
	if (!eb || (eb.dnf && ea && !ea.dnf)) return 0;
	if (!ea || (ea.dnf && !eb.dnf)) return 1;
	if (ea.dnf && eb.dnf) return null;
	return ea.place < eb.place ? 0 : 1;
}

// Inline compare panel, opened under a driver's row: this driver against a
// rival (by default the one just ahead, or just behind for the leader).
// In a category tab the rivals and the chart are limited to that category.
export default function DriverCompare({ username, season, teamsByUser, contextCategory, onClose }) {
	const board = contextCategory ? season.standings.categories[contextCategory] || {} : season.standings.drivers;
	const [rival, setRival] = useState(() => rivalOf(board, username));
	const [mode, setMode] = useState(contextCategory ? 'category' : 'overall');

	const a = useMemo(() => driverProfile(season, teamsByUser, username), [season, teamsByUser, username]);
	const b = useMemo(() => (rival ? driverProfile(season, teamsByUser, rival) : null), [season, teamsByUser, rival]);
	const h2h = useMemo(() => (b ? headToHead(season, a.username, b.username) : null), [season, a, b]);

	const ranks = rankMap(board);
	const options = sortByPointsDesc(board)
		.filter(([name]) => name !== username)
		.map(([name]) => ({
			value: name,
			label: `P${ranks[name]} · ${name}${!contextCategory && teamsByUser[name]?.category ? ` · ${teamsByUser[name].category}` : ''}`,
		}));

	const header = (
		<header className="detail-head compare-head">
			<div className="versus">
				<span className="versus-name">
					<Swatch i={0} />
					<Flag nat={a.info.nat} />
					<ProfileLink href={driverHref(username)} title="Open profile page">
						{username}
					</ProfileLink>
				</span>
				<span className="versus-vs">vs</span>
				{options.length > 0 && (
					<CompareSelect
						label={contextCategory ? `${contextCategory} rival` : 'Rival'}
						value={rival}
						options={options}
						onChange={setRival}
					/>
				)}
			</div>
			<button type="button" className="icon-btn" aria-label={`Close ${username} comparison`} onClick={onClose}>
				<CloseIcon />
			</button>
		</header>
	);

	if (!b) {
		return (
			<div className="driver-detail compare-panel" role="region" aria-label={`${username} comparison`}>
				{header}
				<p className="detail-note">No other drivers to compare with yet.</p>
			</div>
		);
	}

	// Category points only compare like with like.
	const sameCategory = Boolean(a.category) && a.category === b.category;
	const chartMode = sameCategory ? mode : 'overall';
	const useCategory = contextCategory && sameCategory;
	const pts = (p) => (useCategory ? p.categoryPoints : p.points);
	const pos = (p) => (useCategory ? p.categoryPos : p.pos);
	const gap = gapSentence(pts(a), pts(b));
	const people = [a, b];

	const rows = [
		[useCategory ? `${contextCategory} standings` : 'Championship', (p) => <><strong>{place(pos(p))}</strong> · {pts(p)} pts</>],
		['Head-to-head', (p, i) => <><strong>{i === 0 ? h2h.a : h2h.b}</strong> {plural(i === 0 ? h2h.a : h2h.b, 'round').replace(/^\d+ /, '')} ahead</>],
		['Wins', (p) => p.summary.wins],
		['Podiums', (p) => p.summary.podiums],
		['Best finish', (p) => place(p.summary.bestFinish)],
		['Avg finish', (p) => (p.summary.avgFinish ? `P${p.summary.avgFinish.toFixed(1)}` : '–')],
		['Avg pace', (p) => (p.summary.avgPace ? formatPace(p.summary.avgPace) : '–')],
		['DNFs', (p) => p.summary.dnfs],
	];

	return (
		<div className="driver-detail compare-panel" role="region" aria-label={`${username} compared with ${rival}`}>
			{header}

			<p className="compare-summary">
				<strong>{username}</strong> {gap.verb} <strong>{rival}</strong> {gap.amount}
				{useCategory ? ` in ${contextCategory}` : ''}
				{h2h.a + h2h.b > 0 && (
					<>
						{' '}
						· head-to-head <strong>{h2h.a}–{h2h.b}</strong>
					</>
				)}
			</p>

			<div className="compare-wrap">
				<table className="compare-table">
					<thead>
						<tr>
							<th scope="col">
								<span className="visually-hidden">Stat</span>
							</th>
							{people.map((p, i) => (
								<th key={p.username} scope="col">
									<div className="detail-driver" title={p.username}>
										<Swatch i={i} />
										<strong>{p.username}</strong>
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map(([label, get]) => (
							<tr key={label}>
								<th scope="row">{label}</th>
								{people.map((p, i) => (
									<td key={p.username}>{get(p, i)}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<section className="detail-section">
				<div className="detail-section-head">
					<h4>{chartMode === 'category' ? `${a.category} points` : 'Championship points'}</h4>
					{sameCategory ? (
						<Tabs
							items={[
								{ value: 'overall', label: 'Overall' },
								{ value: 'category', label: a.category },
							]}
							value={chartMode}
							onChange={setMode}
							label="Points chart"
							className="segmented"
						/>
					) : (
						a.category && <span className="detail-note">Different categories — overall points</span>
					)}
				</div>
				<PointsChart
					labels={a.summary.perRound.map((r) => r.name)}
					series={people.map((p) => ({
						name: p.username,
						values: p.summary.perRound.map((r) => ({
							value: chartMode === 'category' ? r.categoryCumulative : r.cumulative,
							gained: r.entry ? (chartMode === 'category' ? r.entry.categoryPoints : r.entry.points) : null,
						})),
					}))}
				/>
			</section>

			<section className="detail-section">
				<h4>Round by round</h4>
				<div className="table-scroll">
					<table className="detail-table battle-table">
						<thead>
							<tr>
								<th scope="col">Round</th>
								{people.map((p, i) => (
									<th key={p.username} scope="col" colSpan={2} className="person-col">
										<Swatch i={i} />
										{p.username}
									</th>
								))}
								<th scope="col">Ahead</th>
							</tr>
						</thead>
						<tbody>
							{a.summary.perRound.map((r, i) => {
								const ea = r.entry;
								const eb = b.summary.perRound[i].entry;
								const ahead = roundAhead(ea, eb);
								return (
									<tr key={r.id}>
										<th scope="row">{r.name}</th>
										{[ea, eb].map((e, n) =>
											e ? (
												<CellPair key={n} entry={e} category={useCategory} />
											) : (
												<td key={n} colSpan={2} className="cell-empty">
													DNS
												</td>
											)
										)}
										<td className="cell-ahead">
											{ahead === null ? '—' : (
												<span className="ahead-tag">
													<Swatch i={ahead} />
													{people[ahead].username}
												</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}

function CellPair({ entry, category }) {
	const placeNum = category ? entry.categoryPlace : entry.place;
	return (
		<>
			<td>{entry.dnf ? <span className="cell-dnf">DNF</span> : place(placeNum)}</td>
			<td>{category ? entry.categoryPoints : entry.points} pts</td>
		</>
	);
}
