import { useMemo, useState } from 'react';
import { CloseIcon } from './Icons';
import { ProfileLink } from './Leaderboard';
import PointsChart, { SERIES_COLORS } from './PointsChart';
import { CompareSelect, gapSentence, place, realTeamBoard, rivalOf } from './profileParts';
import { driverHref, teamHref } from '../hooks/useHashRoute';
import { rankMap, sortByPointsDesc, teamHeadToHead, teamSummary } from '../lib/season';

function Swatch({ i }) {
	return <span className="legend-swatch" style={{ background: SERIES_COLORS[i] }} />;
}

const topScorer = (t) => {
	const [name, pts] = Object.entries(t.contributions).sort((x, y) => y[1] - x[1])[0] || [];
	return name ? { name, pts } : null;
};

// Inline compare panel, opened under a team's row: this team against a rival
// (by default the team just ahead, or just behind for the leader).
export default function TeamCompare({ team, season, onClose }) {
	const board = realTeamBoard(season);
	const [rival, setRival] = useState(() => rivalOf(board, team));
	const a = useMemo(() => teamSummary(season, team), [season, team]);
	const b = useMemo(() => (rival ? teamSummary(season, rival) : null), [season, rival]);
	const h2h = useMemo(() => (b ? teamHeadToHead(season, team, rival) : null), [season, team, rival, b]);

	const ranks = rankMap(board);
	const options = sortByPointsDesc(board)
		.filter(([name]) => name !== team)
		.map(([name]) => ({ value: name, label: `P${ranks[name]} · ${name}` }));

	const header = (
		<header className="detail-head compare-head">
			<div className="versus">
				<span className="versus-name">
					<Swatch i={0} />
					<ProfileLink href={teamHref(team)} title="Open team page">
						{team}
					</ProfileLink>
				</span>
				<span className="versus-vs">vs</span>
				{options.length > 0 && <CompareSelect label="Rival team" value={rival} options={options} onChange={setRival} />}
			</div>
			<button type="button" className="icon-btn" aria-label={`Close ${team} comparison`} onClick={onClose}>
				<CloseIcon />
			</button>
		</header>
	);

	if (!b) {
		return (
			<div className="driver-detail compare-panel" role="region" aria-label={`${team} comparison`}>
				{header}
				<p className="detail-note">No other teams to compare with yet.</p>
			</div>
		);
	}

	const teams = [a, b];
	const gap = gapSentence(a.points, b.points);
	const rows = [
		['Championship', (t) => <><strong>{place(t.pos)}</strong> · {t.points} pts</>],
		['Head-to-head', (t, i) => <><strong>{i === 0 ? h2h.a : h2h.b}</strong> rounds ahead</>],
		['Round wins', (t) => t.roundWins],
		['Round podiums', (t) => t.roundPodiums],
		['Best round', (t) => (t.bestRound ? `${t.bestRound.points} pts` : '–')],
		['Avg per round', (t) => (t.avgPoints === null ? '–' : t.avgPoints.toFixed(1))],
		['Drivers used', (t) => t.members.length],
		['Top scorer', (t) => {
			const top = topScorer(t);
			return top ? <><ProfileLink href={driverHref(top.name)}>{top.name}</ProfileLink> · {top.pts}</> : '–';
		}],
	];

	return (
		<div className="driver-detail compare-panel" role="region" aria-label={`${team} compared with ${rival}`}>
			{header}

			<p className="compare-summary">
				<strong>{team}</strong> {gap.verb} <strong>{rival}</strong> {gap.amount}
				{h2h.a + h2h.b > 0 && (
					<>
						{' '}
						· rounds won head-to-head <strong>{h2h.a}–{h2h.b}</strong>
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
							{teams.map((t, i) => (
								<th key={t.team} scope="col">
									<div className="detail-driver" title={t.team}>
										<Swatch i={i} />
										<strong>{t.team}</strong>
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map(([label, get]) => (
							<tr key={label}>
								<th scope="row">{label}</th>
								{teams.map((t, i) => (
									<td key={t.team}>{get(t, i)}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<section className="detail-section">
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
				<h4>Round by round</h4>
				<div className="table-scroll">
					<table className="detail-table battle-table">
						<thead>
							<tr>
								<th scope="col">Round</th>
								{teams.map((t, i) => (
									<th key={t.team} scope="col" colSpan={2} className="person-col">
										<Swatch i={i} />
										{t.team}
									</th>
								))}
								<th scope="col">Ahead</th>
							</tr>
						</thead>
						<tbody>
							{a.perRound.map((r, i) => {
								const rb = b.perRound[i];
								const ahead =
									!r.started && !rb.started
										? null
										: !rb.started || (r.points ?? 0) > (rb.points ?? 0)
											? 0
											: !r.started || (rb.points ?? 0) > (r.points ?? 0)
												? 1
												: null;
								return (
									<tr key={r.id}>
										<th scope="row">{r.name}</th>
										{[r, rb].map((x, n) =>
											x.started ? (
												<FragmentCells key={n} round={x} />
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
													{teams[ahead].team}
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

function FragmentCells({ round }) {
	return (
		<>
			<td>{place(round.roundPos)}</td>
			<td>{round.points} pts</td>
		</>
	);
}
