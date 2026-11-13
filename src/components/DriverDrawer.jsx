import { useEffect, useMemo, useRef } from 'react';
import { CloseIcon } from './Icons';
import { Flag, PlatformBadge } from './DriverMeta';
import PointsChart from './PointsChart';
import { formatPace, formatTime } from '../lib/format';
import { driverSummary, rankMap } from '../lib/season';

function Stat({ label, value, detail }) {
	return (
		<div className="stat">
			<span className="stat-label">{label}</span>
			<span className="stat-value">{value}</span>
			{detail && <span className="stat-detail">{detail}</span>}
		</div>
	);
}

// Side panel with one driver's season: standings, stats, points chart, results.
export default function DriverDrawer({ username, season, teamsByUser, platform, onClose }) {
	const closeRef = useRef(null);
	const info = teamsByUser[username] || {};
	const category = info.category;

	useEffect(() => {
		closeRef.current?.focus();
		const onKeyDown = (e) => e.key === 'Escape' && onClose();
		document.addEventListener('keydown', onKeyDown);
		document.body.classList.add('no-scroll');
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.body.classList.remove('no-scroll');
		};
	}, [onClose]);

	const summary = useMemo(() => driverSummary(season, username), [season, username]);
	const overallPos = rankMap(season.standings.drivers)[username];
	const overallPts = season.standings.drivers[username] || 0;
	const driverCount = Object.keys(season.standings.drivers).length;
	const categoryBoard = season.standings.categories[category] || {};
	const categoryPos = rankMap(categoryBoard)[username];

	return (
		<div className="drawer-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
			<aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
				<header className="drawer-head">
					<div className="drawer-heading">
						<h2 id="drawer-title">
							<Flag nat={info.nat} />
							<span>{username}</span>
						</h2>
						<p className="drawer-sub">
							{info.name && <span>{info.name}</span>}
							<span>{info.team || 'No team'}</span>
							{category && <span className={`chip chip-${category.toLowerCase()}`}>{category}</span>}
							<PlatformBadge platform={platform} />
						</p>
					</div>
					<button ref={closeRef} type="button" className="icon-btn" aria-label="Close driver details" onClick={onClose}>
						<CloseIcon />
					</button>
				</header>

				<div className="stat-grid">
					<Stat
						label="Championship"
						value={overallPos ? `P${overallPos}` : '–'}
						detail={`${overallPts} pts · of ${driverCount}`}
					/>
					{category && (
						<Stat
							label={`${category} standings`}
							value={categoryPos ? `P${categoryPos}` : '–'}
							detail={`${categoryBoard[username] || 0} pts`}
						/>
					)}
					<Stat label="Wins" value={summary.wins} detail={`${summary.podiums} podium${summary.podiums === 1 ? '' : 's'}`} />
					<Stat label="Best finish" value={summary.bestFinish ? `P${summary.bestFinish}` : '–'} />
					<Stat label="Avg pace" value={summary.avgPace ? formatPace(summary.avgPace) : '–'} detail="of winner's time" />
					<Stat label="Starts" value={summary.starts} detail={summary.dnfs ? `${summary.dnfs} DNF` : 'no DNFs'} />
				</div>

				<section className="drawer-section">
					<h3>Points progression</h3>
					<PointsChart
						data={summary.perRound.map((r) => ({
							label: r.name,
							value: r.cumulative,
							gained: r.entry ? r.entry.points : null,
						}))}
					/>
				</section>

				<section className="drawer-section">
					<h3>Results</h3>
					<div className="table-scroll">
						<table className="drawer-table">
							<thead>
								<tr>
									<th scope="col">Round</th>
									<th scope="col">Pos</th>
									{category && <th scope="col">{category}</th>}
									<th scope="col">Time</th>
									<th scope="col">Pts</th>
								</tr>
							</thead>
							<tbody>
								{summary.perRound.map(({ id, name, entry }) => (
									<tr key={id}>
										<th scope="row">{name}</th>
										{!entry ? (
											<td colSpan={category ? 4 : 3} className="cell-empty">
												Did not start
											</td>
										) : (
											<>
												<td>{entry.dnf ? <span className="cell-dnf">DNF</span> : `P${entry.place}`}</td>
												{category && <td>{entry.categoryPlace ? `P${entry.categoryPlace}` : '–'}</td>}
												<td title={`${formatPace(entry.pct)} of winner`}>{formatTime(entry.time)}</td>
												<td>{entry.points}</td>
											</>
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</aside>
		</div>
	);
}
