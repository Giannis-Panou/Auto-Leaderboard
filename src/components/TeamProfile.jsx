import { useMemo } from 'react';
import { Flag, PlatformBadge } from './DriverMeta';
import { ProfileLink } from './Leaderboard';
import PointsChart from './PointsChart';
import { neighbours, place, plural, realTeamBoard, Stat } from './profileParts';
import { driverHref, teamHref } from '../hooks/useHashRoute';
import { rankMap, teamSummary } from '../lib/season';

function CountChips({ counts, chipClass }) {
	return Object.entries(counts)
		.sort()
		.map(([key, n]) => (
			<span key={key} className={chipClass(key)}>
				{key}
				{n > 1 ? ` ×${n}` : ''}
			</span>
		));
}

const countBy = (items) => items.reduce((acc, k) => (k ? { ...acc, [k]: (acc[k] || 0) + 1 } : acc), {});

// Full team profile page: the line-up and the team's whole season.
// (Comparing teams lives in the quick panel under each team row.)
export default function TeamProfile({ team, season, teamsByUser, platformOf }) {
	const t = useMemo(() => teamSummary(season, team), [season, team]);
	const near = neighbours(realTeamBoard(season), team);
	const ranks = rankMap(season.standings.drivers);

	// Latest car each member drove
	const carOf = {};
	season.rounds.forEach((r) => r.entries.forEach((e) => e.team === team && (carOf[e.username] = e.car)));

	const members = [...t.members].sort((x, y) => (season.standings.drivers[y] || 0) - (season.standings.drivers[x] || 0));
	const categories = countBy(members.map((m) => teamsByUser[m]?.category));
	const platforms = countBy(members.map((m) => platformOf[m]));
	const nats = [...new Set(members.map((m) => teamsByUser[m]?.nat).filter(Boolean))];

	return (
		<div className="driver-detail is-page team-page profile-page-card" role="region" aria-label={`${team} team profile`}>
			<header className="detail-head">
				<div className="detail-heading">
					<h2>
						<span className="team-mark" aria-hidden="true" />
						<span>{team}</span>
					</h2>
					<dl className="facts">
						<div className="fact">
							<dt>Drivers</dt>
							<dd>{members.length}</dd>
						</div>
						<div className="fact">
							<dt>Categories</dt>
							<dd className="fact-inline">
								<CountChips counts={categories} chipClass={(c) => `chip chip-${c.toLowerCase()}`} />
							</dd>
						</div>
						{Object.keys(platforms).length > 0 && (
							<div className="fact">
								<dt>Platforms</dt>
								<dd className="fact-inline">
									{Object.entries(platforms).map(([pl, n]) => (
										<span key={pl} className="fact-inline">
											<PlatformBadge platform={pl} />
											{n > 1 && `×${n}`}
										</span>
									))}
								</dd>
							</div>
						)}
						{nats.length > 0 && (
							<div className="fact">
								<dt>Nationalities</dt>
								<dd className="fact-inline">
									{nats.map((nat) => (
										<Flag key={nat} nat={nat} />
									))}
								</dd>
							</div>
						)}
					</dl>
				</div>
				<div className="neighbours" aria-label="Championship neighbours">
					{near.ahead && (
						<span>
							<span className="field-label">Ahead</span>
							<ProfileLink href={teamHref(near.ahead.name)}>{near.ahead.name}</ProfileLink>{' '}
							<span className="gap-chip is-ahead">+{near.ahead.gap}</span>
						</span>
					)}
					{near.behind && (
						<span>
							<span className="field-label">Behind</span>
							<ProfileLink href={teamHref(near.behind.name)}>{near.behind.name}</ProfileLink>{' '}
							<span className="gap-chip is-behind">−{near.behind.gap}</span>
						</span>
					)}
				</div>
			</header>

			<div className="stat-grid">
				<Stat label="Championship" value={place(t.pos)} detail={`${t.points} pts · of ${t.teamCount} teams`} />
				<Stat label="Round wins" value={t.roundWins} detail={plural(t.roundPodiums, 'round podium')} />
				<Stat label="Best round" value={t.bestRound ? t.bestRound.points : '–'} detail={t.bestRound?.name} />
				<Stat label="Avg per round" value={t.avgPoints === null ? '–' : t.avgPoints.toFixed(1)} detail="points" />
				<Stat label="Drivers used" value={members.length} detail={plural(t.starts, 'round') + ' started'} />
			</div>

			<section className="detail-section chart-section">
				<div className="detail-section-head">
					<h4>Team points</h4>
				</div>
				<PointsChart
					labels={t.perRound.map((r) => r.name)}
					series={[
						{ name: team, values: t.perRound.map((r) => ({ value: r.cumulative, gained: r.started ? r.points ?? 0 : null })) },
					]}
				/>
			</section>

			<section className="detail-section">
				<h4>Line-up</h4>
				<div className="table-scroll">
					<table className="detail-table roster-table">
						<thead>
							<tr>
								<th scope="col">Driver</th>
								<th scope="col">Name</th>
								<th scope="col">Cat</th>
								<th scope="col">Platform</th>
								<th scope="col">Car</th>
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
									<td className="cell-soft">{teamsByUser[name]?.name || '–'}</td>
									<td>{teamsByUser[name]?.category || '–'}</td>
									<td>
										<PlatformBadge platform={platformOf[name]} />
									</td>
									<td className="cell-car">{carOf[name] || '–'}</td>
									<td>{place(ranks[name])}</td>
									<td>{season.standings.drivers[name] || 0}</td>
									<td>{t.contributions[name] || 0}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="detail-section">
				<h4>Results</h4>
				<div className="table-scroll">
					<table className="detail-table">
						<thead>
							<tr>
								<th scope="col">Round</th>
								<th scope="col">Pts</th>
								<th scope="col" title="Team position in that round">Round pos</th>
								<th scope="col">Drivers</th>
								<th scope="col">Scored by</th>
							</tr>
						</thead>
						<tbody>
							{t.perRound.map((r) => (
								<tr key={r.id}>
									<th scope="row">{r.name}</th>
									{!r.started ? (
										<td colSpan={4} className="cell-empty">
											Did not start
										</td>
									) : (
										<>
											<td>{r.points}</td>
											<td>{place(r.roundPos)}</td>
											<td>{r.drivers}</td>
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
