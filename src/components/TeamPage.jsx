import { useMemo, useState } from 'react';
import { Flag } from './DriverMeta';
import { ProfileLink } from './Leaderboard';
import PointsChart, { SERIES_COLORS } from './PointsChart';
import { driverHref } from '../hooks/useHashRoute';
import { isRealTeam, rankMap, sortByPointsDesc, teamHeadToHead, teamSummary } from '../lib/season';

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

// Category mix of a team's drivers, e.g. CA1 ×2, CA2 ×1.
function CategoryChips({ members, teamsByUser }) {
	const counts = {};
	members.forEach((name) => {
		const cat = teamsByUser[name]?.category;
		if (cat) counts[cat] = (counts[cat] || 0) + 1;
	});
	return Object.entries(counts)
		.sort()
		.map(([cat, n]) => (
			<span key={cat} className={`chip chip-${cat.toLowerCase()}`}>
				{cat}
				{n > 1 ? ` ×${n}` : ''}
			</span>
		));
}

// Team members, best season first, with how many of their points counted for the team.
function Roster({ summary, season, teamsByUser, color }) {
	const ranks = rankMap(season.standings.drivers);
	const members = [...summary.members].sort(
		(x, y) => (season.standings.drivers[y] || 0) - (season.standings.drivers[x] || 0)
	);
	return (
		<div className="table-scroll">
			<table className="detail-table roster-table">
				<thead>
					<tr>
						<th scope="col">
							{color && <span className="legend-swatch" style={{ background: color }} />}
							{summary.team}
						</th>
						<th scope="col">Cat</th>
						<th scope="col">Pos</th>
						<th scope="col">Pts</th>
						<th scope="col" title="Points that counted towards the team score">For team</th>
					</tr>
				</thead>
				<tbody>
					{members.map((name) => (
						<tr key={name}>
							<th scope="row">
								<span className="roster-name">
									<Flag nat={teamsByUser[name]?.nat} />
									<ProfileLink href={driverHref(name)}>{name}</ProfileLink>
								</span>
							</th>
							<td>{teamsByUser[name]?.category || '–'}</td>
							<td>{place(ranks[name])}</td>
							<td>{season.standings.drivers[name] || 0}</td>
							<td>{summary.contributions[name] || 0}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// Full team profile page, with an optional comparison against another team.
export default function TeamPage({ team, season, teamsByUser }) {
	const [compareWith, setCompareWith] = useState('');
	const a = useMemo(() => teamSummary(season, team), [season, team]);
	const b = useMemo(() => (compareWith ? teamSummary(season, compareWith) : null), [season, compareWith]);
	const h2h = useMemo(() => (b ? teamHeadToHead(season, a.team, b.team) : null), [season, a, b]);
	const teams = [a, b].filter(Boolean);

	const realTeams = Object.fromEntries(Object.entries(season.standings.teams).filter(([t]) => isRealTeam(t)));
	const ranks = rankMap(realTeams);
	const compareOptions = sortByPointsDesc(realTeams).filter(([name]) => name !== team);

	const statRows = [
		['Championship', (t) => <><strong>{place(t.pos)}</strong> · {t.points} pts</>],
		['Round wins', (t) => t.roundWins],
		['Round podiums', (t) => t.roundPodiums],
		['Best round', (t) => (t.bestRound ? `${t.bestRound.points} pts` : '–')],
		['Avg per round', (t) => (t.avgPoints === null ? '–' : t.avgPoints.toFixed(1))],
		['Drivers used', (t) => t.members.length],
	];

	return (
		<div className="driver-detail is-page team-page" role="region" aria-label={`${team} team profile`}>
			<header className="detail-head">
				<div className="detail-heading">
					<h2>
						<span className="team-mark" aria-hidden="true" />
						<span>{a.team}</span>
					</h2>
					<p className="detail-sub">
						<span>
							{a.members.length} driver{a.members.length === 1 ? '' : 's'}
						</span>
						<CategoryChips members={a.members} teamsByUser={teamsByUser} />
					</p>
				</div>
				<div className="detail-actions">
					<label className="compare-select">
						<span className="visually-hidden">Compare with another team</span>
						<span className="select-wrap">
							<select value={compareWith} onChange={(e) => setCompareWith(e.target.value)}>
								<option value="">Compare with team…</option>
								{compareOptions.map(([name]) => (
									<option key={name} value={name}>
										P{ranks[name]} · {name}
									</option>
								))}
							</select>
						</span>
					</label>
				</div>
			</header>

			{b ? (
				<div className="compare-wrap">
					<table className="compare-table">
						<thead>
							<tr>
								<th scope="col">
									<span className="visually-hidden">Stat</span>
								</th>
								{teams.map((t, i) => (
									<th key={t.team} scope="col">
										<div className="detail-driver" title={t.team}>
											<span className="legend-swatch" style={{ background: SERIES_COLORS[i] }} />
											<strong>{t.team}</strong>
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{statRows.slice(0, 1).map(([label, get]) => (
								<tr key={label}>
									<th scope="row">{label}</th>
									{teams.map((t) => (
										<td key={t.team}>{get(t)}</td>
									))}
								</tr>
							))}
							<tr>
								<th scope="row">Head-to-head</th>
								<td>
									<strong>{h2h.a}</strong> round{h2h.a === 1 ? '' : 's'} ahead
								</td>
								<td>
									<strong>{h2h.b}</strong> round{h2h.b === 1 ? '' : 's'} ahead
								</td>
							</tr>
							{statRows.slice(1).map(([label, get]) => (
								<tr key={label}>
									<th scope="row">{label}</th>
									{teams.map((t) => (
										<td key={t.team}>{get(t)}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="stat-grid">
					<Stat label="Championship" value={place(a.pos)} detail={`${a.points} pts · of ${a.teamCount} teams`} />
					<Stat label="Round wins" value={a.roundWins} detail={`${a.roundPodiums} round podium${a.roundPodiums === 1 ? '' : 's'}`} />
					<Stat label="Best round" value={a.bestRound ? `${a.bestRound.points}` : '–'} detail={a.bestRound?.name} />
					<Stat label="Avg per round" value={a.avgPoints === null ? '–' : a.avgPoints.toFixed(1)} detail="points" />
					<Stat label="Drivers used" value={a.members.length} detail={`${a.starts} round${a.starts === 1 ? '' : 's'} started`} />
				</div>
			)}

			<section className="detail-section chart-section">
				<div className="detail-section-head">
					<h4>Team points</h4>
				</div>
				<PointsChart
					labels={a.perRound.map((r) => r.name)}
					series={teams.map((t) => ({
						name: t.team,
						values: t.perRound.map((r) => ({ value: r.cumulative, gained: r.started ? r.points ?? 0 : null })),
					}))}
				/>
			</section>

			<section className="detail-section">
				<h4>Drivers</h4>
				<div className={b ? 'roster-compare' : ''}>
					{teams.map((t, i) => (
						<Roster key={t.team} summary={t} season={season} teamsByUser={teamsByUser} color={b ? SERIES_COLORS[i] : undefined} />
					))}
				</div>
			</section>

			<section className="detail-section">
				<h4>Results</h4>
				<div className="table-scroll">
					<table className="detail-table">
						<thead>
							{b ? (
								<tr>
									<th scope="col">Round</th>
									{teams.map((t, i) => (
										<th key={t.team} scope="col" colSpan={2} className="person-col">
											<span className="legend-swatch" style={{ background: SERIES_COLORS[i] }} />
											{t.team}
										</th>
									))}
								</tr>
							) : (
								<tr>
									<th scope="col">Round</th>
									<th scope="col">Pts</th>
									<th scope="col" title="Team position in that round">Round pos</th>
									<th scope="col">Scored by</th>
								</tr>
							)}
						</thead>
						<tbody>
							{a.perRound.map((r, i) => (
								<tr key={r.id}>
									<th scope="row">{r.name}</th>
									{b ? (
										teams.map((t) => {
											const tr = t.perRound[i];
											return tr.started ? (
												<FragmentCells key={t.team} round={tr} />
											) : (
												<td key={t.team} colSpan={2} className="cell-empty">
													DNS
												</td>
											);
										})
									) : !r.started ? (
										<td colSpan={3} className="cell-empty">
											Did not start
										</td>
									) : (
										<>
											<td>{r.points}</td>
											<td>{place(r.roundPos)}</td>
											<td className="cell-scorers">
												{r.scorers.map((name, n) => (
													<span key={name}>
														{n > 0 && ', '}
														<ProfileLink href={driverHref(name)}>{name}</ProfileLink>
													</span>
												))}
											</td>
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

function FragmentCells({ round }) {
	return (
		<>
			<td>{place(round.roundPos)}</td>
			<td>{round.points} pts</td>
		</>
	);
}
