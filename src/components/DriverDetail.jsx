import { useMemo, useState } from 'react';
import { CloseIcon } from './Icons';
import { Flag, PlatformBadge } from './DriverMeta';
import PointsChart, { SERIES_COLORS } from './PointsChart';
import Tabs from './Tabs';
import { formatPace, formatTime } from '../lib/format';
import { driverSummary, headToHead, rankMap, sortByPointsDesc } from '../lib/season';

// Everything shown about one driver, ready for display.
function profile(season, teamsByUser, username) {
	const info = teamsByUser[username] || {};
	const summary = driverSummary(season, username);
	const category = info.category;
	const categoryBoard = (category && season.standings.categories[category]) || {};
	return {
		username,
		info,
		category,
		summary,
		pos: rankMap(season.standings.drivers)[username],
		points: season.standings.drivers[username] || 0,
		categoryPos: rankMap(categoryBoard)[username],
		categoryPoints: categoryBoard[username] || 0,
	};
}

const place = (p) => (p ? `P${p}` : '–');

function Stat({ label, value, detail }) {
	return (
		<div className="stat">
			<span className="stat-label">{label}</span>
			<span className="stat-value">{value}</span>
			{detail && <span className="stat-detail">{detail}</span>}
		</div>
	);
}

// Compact column heading for the comparison table (swatch matches the chart line).
function DriverHeading({ p, color }) {
	return (
		<div className="detail-driver" title={p.username}>
			<span className="legend-swatch" style={{ background: color }} />
			<Flag nat={p.info.nat} />
			<strong>{p.username}</strong>
		</div>
	);
}

// Inline driver profile, opened under the driver's row. `contextCategory` is
// the category tab the profile was opened from (if any): comparisons are then
// limited to that category and the chart starts on its points.
export default function DriverDetail({ username, season, teamsByUser, platformOf, contextCategory, onClose }) {
	const [compareWith, setCompareWith] = useState('');
	const [mode, setMode] = useState(contextCategory ? 'category' : 'overall');

	const a = useMemo(() => profile(season, teamsByUser, username), [season, teamsByUser, username]);
	const b = useMemo(
		() => (compareWith ? profile(season, teamsByUser, compareWith) : null),
		[season, teamsByUser, compareWith]
	);
	const h2h = useMemo(() => (b ? headToHead(season, a.username, b.username) : null), [season, a, b]);

	// Category chart only makes sense when both drivers share the category.
	const canShowCategory = Boolean(a.category) && (!b || b.category === a.category);
	const chartMode = canShowCategory ? mode : 'overall';
	const valueOf = (r) => (chartMode === 'category' ? r.categoryCumulative : r.cumulative);
	const gainedOf = (r) => (r.entry ? (chartMode === 'category' ? r.entry.categoryPoints : r.entry.points) : null);
	const series = [a, b].filter(Boolean).map((p) => ({
		name: p.username,
		values: p.summary.perRound.map((r) => ({ value: valueOf(r), gained: gainedOf(r) })),
	}));

	// Compare candidates: the current category's drivers (by category position),
	// or everyone (by championship position) when opened from an overall view.
	const compareBoard = contextCategory ? season.standings.categories[contextCategory] || {} : season.standings.drivers;
	const ranks = rankMap(compareBoard);
	const compareOptions = sortByPointsDesc(compareBoard).filter(([name]) => name !== username);
	const people = [a, b].filter(Boolean);

	return (
		<div className="driver-detail" role="region" aria-label={`${username} profile`}>
			<header className="detail-head">
				<div className="detail-heading">
					<h3>
						<Flag nat={a.info.nat} />
						<span>{a.username}</span>
					</h3>
					<p className="detail-sub">
						{a.info.name && <span>{a.info.name}</span>}
						<span>{a.info.team || 'No team'}</span>
						{a.category && <span className={`chip chip-${a.category.toLowerCase()}`}>{a.category}</span>}
						<PlatformBadge platform={platformOf[username]} />
					</p>
				</div>
				<div className="detail-actions">
					<label className="compare-select">
						<span className="visually-hidden">Compare with another driver</span>
						<span className="select-wrap">
							<select value={compareWith} onChange={(e) => setCompareWith(e.target.value)}>
								<option value="">{contextCategory ? `Compare with ${contextCategory} driver…` : 'Compare with…'}</option>
								{compareOptions.map(([name]) => (
									<option key={name} value={name}>
										P{ranks[name]} · {name}
										{!contextCategory && teamsByUser[name]?.category ? ` · ${teamsByUser[name].category}` : ''}
									</option>
								))}
							</select>
						</span>
					</label>
					<button type="button" className="icon-btn" aria-label={`Close ${username} profile`} onClick={onClose}>
						<CloseIcon />
					</button>
				</div>
			</header>

			{b ? (
				<div>
					<table className="compare-table">
						<thead>
							<tr>
								<th scope="col">
									<span className="visually-hidden">Stat</span>
								</th>
								{people.map((p, i) => (
									<th key={p.username} scope="col">
										<DriverHeading p={p} color={SERIES_COLORS[i]} />
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">Championship</th>
								{people.map((p) => (
									<td key={p.username}>
										<strong>{place(p.pos)}</strong> · {p.points} pts
									</td>
								))}
							</tr>
							<tr>
								<th scope="row">Category</th>
								{people.map((p) => (
									<td key={p.username}>
										{p.category ? (
											<>
												<strong>{place(p.categoryPos)}</strong> in {p.category} · {p.categoryPoints} pts
											</>
										) : (
											'–'
										)}
									</td>
								))}
							</tr>
							<tr>
								<th scope="row">Head-to-head</th>
								<td>
									<strong>{h2h.a}</strong> ahead
								</td>
								<td>
									<strong>{h2h.b}</strong> ahead
								</td>
							</tr>
							{[
								['Wins', (p) => p.summary.wins],
								['Podiums', (p) => p.summary.podiums],
								['Best finish', (p) => place(p.summary.bestFinish)],
								['Avg pace', (p) => (p.summary.avgPace ? formatPace(p.summary.avgPace) : '–')],
								['Starts', (p) => `${p.summary.starts}${p.summary.dnfs ? ` (${p.summary.dnfs} DNF)` : ''}`],
							].map(([label, get]) => (
								<tr key={label}>
									<th scope="row">{label}</th>
									{people.map((p) => (
										<td key={p.username}>{get(p)}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="stat-grid">
					<Stat label="Championship" value={place(a.pos)} detail={`${a.points} pts`} />
					{a.category && (
						<Stat label={`${a.category} standings`} value={place(a.categoryPos)} detail={`${a.categoryPoints} pts`} />
					)}
					<Stat label="Wins" value={a.summary.wins} detail={`${a.summary.podiums} podium${a.summary.podiums === 1 ? '' : 's'}`} />
					<Stat label="Best finish" value={place(a.summary.bestFinish)} />
					<Stat label="Avg pace" value={a.summary.avgPace ? formatPace(a.summary.avgPace) : '–'} detail="of winner's time" />
					<Stat label="Starts" value={a.summary.starts} detail={a.summary.dnfs ? `${a.summary.dnfs} DNF` : 'no DNFs'} />
				</div>
			)}

			<section className="detail-section">
				<div className="detail-section-head">
					<h4>{chartMode === 'category' ? `${a.category} points` : 'Championship points'}</h4>
					{canShowCategory ? (
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
						b && a.category && <span className="detail-note">Different categories — overall points only</span>
					)}
				</div>
				<PointsChart labels={a.summary.perRound.map((r) => r.name)} series={series} />
			</section>

			<section className="detail-section">
				<h4>Results</h4>
				<div className="table-scroll">
					<table className="detail-table">
						<thead>
							{b ? (
								<tr>
									<th scope="col">Round</th>
									{people.map((p, i) => (
										<th key={p.username} scope="col" colSpan={2} className="person-col">
											<span className="legend-swatch" style={{ background: SERIES_COLORS[i] }} />
											{p.username}
										</th>
									))}
								</tr>
							) : (
								<tr>
									<th scope="col">Round</th>
									<th scope="col">Pos</th>
									{a.category && <th scope="col">{a.category}</th>}
									<th scope="col">Time</th>
									<th scope="col">Pts</th>
								</tr>
							)}
						</thead>
						<tbody>
							{a.summary.perRound.map((r, i) => (
								<tr key={r.id}>
									<th scope="row">{r.name}</th>
									{b ? (
										people.map((p) => {
											const e = p.summary.perRound[i].entry;
											return !e ? (
												<td key={p.username} colSpan={2} className="cell-empty">
													DNS
												</td>
											) : (
												<FragmentCells key={p.username} entry={e} />
											);
										})
									) : !r.entry ? (
										<td colSpan={a.category ? 4 : 3} className="cell-empty">
											Did not start
										</td>
									) : (
										<>
											<td>{r.entry.dnf ? <span className="cell-dnf">DNF</span> : `P${r.entry.place}`}</td>
											{a.category && <td>{place(r.entry.categoryPlace)}</td>}
											<td title={`${formatPace(r.entry.pct)} of winner`}>{formatTime(r.entry.time)}</td>
											<td>{r.entry.points}</td>
										</>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}

function FragmentCells({ entry }) {
	return (
		<>
			<td>{entry.dnf ? <span className="cell-dnf">DNF</span> : `P${entry.place}`}</td>
			<td>{entry.points} pts</td>
		</>
	);
}
