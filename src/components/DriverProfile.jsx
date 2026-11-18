import { useMemo, useState } from 'react';
import { Flag } from './DriverMeta';
import { ProfileLink } from './Leaderboard';
import PointsChart from './PointsChart';
import Tabs from './Tabs';
import { driverProfile, neighbours, place, plural, Stat } from './profileParts';
import { driverHref, teamHref } from '../hooks/useHashRoute';
import { formatGap, formatPace, formatTime } from '../lib/format';
import { PLATFORMS } from '../lib/platform';
import { isRealTeam } from '../lib/season';

const platformName = (p) => PLATFORMS.find((x) => x.value === p)?.label;

// Full driver profile page: who they are and their whole season.
// (Comparing drivers lives in the quick panel under each row.)
export default function DriverProfile({ username, season, teamsByUser, platformOf }) {
	const p = useMemo(() => driverProfile(season, teamsByUser, username), [season, teamsByUser, username]);
	const [mode, setMode] = useState('overall');
	const { info, category, summary } = p;
	const chartMode = category ? mode : 'overall';
	const near = neighbours(season.standings.drivers, username);

	const facts = [
		['Real name', info.name],
		['Nationality', info.nat && (
			<span className="fact-inline">
				<Flag nat={info.nat} /> {info.nat}
			</span>
		)],
		['Team', isRealTeam(info.team) ? <ProfileLink href={teamHref(info.team)}>{info.team}</ProfileLink> : info.team || 'Privateer'],
		['Category', category && <span className={`chip chip-${category.toLowerCase()}`}>{category}</span>],
		['Platform', platformName(platformOf[username])],
		[summary.cars.length > 1 ? 'Cars' : 'Car', summary.cars.join(', ')],
	].filter(([, v]) => v);

	return (
		<div className="driver-detail is-page profile-page-card" role="region" aria-label={`${username} profile`}>
			<header className="detail-head">
				<div className="detail-heading">
					<h2>
						<Flag nat={info.nat} />
						<span>{username}</span>
					</h2>
					<dl className="facts">
						{facts.map(([label, value]) => (
							<div key={label} className="fact">
								<dt>{label}</dt>
								<dd>{value}</dd>
							</div>
						))}
					</dl>
				</div>
				<div className="neighbours" aria-label="Championship neighbours">
					{near.ahead && (
						<span>
							<span className="field-label">Ahead</span>
							<ProfileLink href={driverHref(near.ahead.name)}>{near.ahead.name}</ProfileLink>{' '}
							<span className="gap-chip is-ahead">+{near.ahead.gap}</span>
						</span>
					)}
					{near.behind && (
						<span>
							<span className="field-label">Behind</span>
							<ProfileLink href={driverHref(near.behind.name)}>{near.behind.name}</ProfileLink>{' '}
							<span className="gap-chip is-behind">−{near.behind.gap}</span>
						</span>
					)}
				</div>
			</header>

			<div className="stat-grid">
				<Stat label="Championship" value={place(p.pos)} detail={`${p.points} pts · of ${Object.keys(season.standings.drivers).length}`} />
				{category && <Stat label={`${category} standings`} value={place(p.categoryPos)} detail={`${p.categoryPoints} pts`} />}
				<Stat label="Wins" value={summary.wins} detail={plural(summary.podiums, 'podium')} />
				<Stat label="Best finish" value={place(summary.bestFinish)} />
				<Stat label="Avg finish" value={summary.avgFinish ? `P${summary.avgFinish.toFixed(1)}` : '–'} />
				<Stat label="Avg pace" value={summary.avgPace ? formatPace(summary.avgPace) : '–'} detail="of winner's time" />
				<Stat label="Pts per start" value={summary.pointsPerStart === null ? '–' : summary.pointsPerStart.toFixed(1)} />
				<Stat label="Starts" value={summary.starts} detail={summary.dnfs ? `${summary.dnfs} DNF` : 'no DNFs'} />
			</div>

			<section className="detail-section chart-section">
				<div className="detail-section-head">
					<h4>{chartMode === 'category' ? `${category} points` : 'Championship points'}</h4>
					{category && (
						<Tabs
							items={[
								{ value: 'overall', label: 'Overall' },
								{ value: 'category', label: category },
							]}
							value={chartMode}
							onChange={setMode}
							label="Points chart"
							className="segmented"
						/>
					)}
				</div>
				<PointsChart
					labels={summary.perRound.map((r) => r.name)}
					series={[
						{
							name: username,
							values: summary.perRound.map((r) => ({
								value: chartMode === 'category' ? r.categoryCumulative : r.cumulative,
								gained: r.entry ? (chartMode === 'category' ? r.entry.categoryPoints : r.entry.points) : null,
							})),
						},
					]}
				/>
			</section>

			<section className="detail-section">
				<h4>Results</h4>
				<div className="table-scroll">
					<table className="detail-table">
						<thead>
							<tr>
								<th scope="col">Round</th>
								<th scope="col">Pos</th>
								{category && <th scope="col">{category}</th>}
								<th scope="col">Car</th>
								<th scope="col">Time</th>
								<th scope="col">Gap</th>
								<th scope="col">Pace</th>
								<th scope="col">Pts</th>
								{category && <th scope="col">{category} pts</th>}
							</tr>
						</thead>
						<tbody>
							{summary.perRound.map(({ id, name, entry: e }) => (
								<tr key={id}>
									<th scope="row">{name}</th>
									{!e ? (
										<td colSpan={category ? 8 : 6} className="cell-empty">
											Did not start
										</td>
									) : (
										<>
											<td>{e.dnf ? <span className="cell-dnf">DNF</span> : `P${e.place}`}</td>
											{category && <td>{place(e.categoryPlace)}</td>}
											<td className="cell-car">{e.car}</td>
											<td>{formatTime(e.time)}</td>
											<td>{e.pct > 100 ? formatGap(e.time - (e.time * 100) / e.pct) : '—'}</td>
											<td>{formatPace(e.pct)}</td>
											<td>{e.points}</td>
											{category && <td>{e.categoryPoints}</td>}
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
