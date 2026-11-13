import { Fragment, useMemo, useState } from 'react';
import { Badge, EmptyState, NameCell, Panel, selectableRow, useExpandedDriver } from './Leaderboard';
import ExportMenu from './ExportMenu';
import Tabs from './Tabs';
import { CloseIcon } from './Icons';
import { formatDateTime } from '../lib/format';
import { isRealTeam, sortByPointsDesc } from '../lib/season';
import { CATEGORIES } from '../lib/pointsSystems';

const TABS = [
	{ value: 'ALL', label: 'All' },
	...CATEGORIES.map((c) => ({ value: c, label: c })),
	{ value: 'TEAMS', label: 'Teams' },
];

// Season grid: one row per driver (or team), one column per round, plus total.
export default function SeasonTable({ season, teamsByUser, platformOf, filter, renderDetail, onRemoveRound, notify }) {
	const [tab, setTab] = useState('ALL');
	const [expanded, toggle, close] = useExpandedDriver();
	const isTeams = tab === 'TEAMS';
	const { rounds, standings } = season;

	// username -> entry, per round, so each cell is a lookup
	const entryMaps = useMemo(
		() => rounds.map((r) => Object.fromEntries(r.entries.map((e) => [e.username, e]))),
		[rounds]
	);

	const board = isTeams
		? Object.fromEntries(Object.entries(standings.teams).filter(([t]) => isRealTeam(t)))
		: tab === 'ALL'
			? standings.drivers
			: standings.categories[tab] || {};

	const rows = sortByPointsDesc(board).map(([name, total], i) => ({ name, total, pos: i + 1 }));
	const visible = rows.filter((r) =>
		isTeams ? filter.matchesTeam(r.name) : filter.matchesDriver(r.name, teamsByUser[r.name]?.team, platformOf[r.name])
	);

	const cell = (roundIndex, name) => {
		if (isTeams) {
			const points = rounds[roundIndex].teamPoints[name];
			return points === undefined ? null : { points };
		}
		const e = entryMaps[roundIndex][name];
		if (!e || (tab !== 'ALL' && e.category !== tab)) return null;
		if (e.dnf) return { dnf: true };
		return tab === 'ALL' ? { points: e.points, place: e.place } : { points: e.categoryPoints, place: e.categoryPlace };
	};

	const cellText = (c) => (!c ? '' : c.dnf ? 'DNF' : c.points);
	const label = isTeams ? 'Team' : 'Driver';
	const title = tab === 'ALL' ? 'Season' : isTeams ? 'Season · teams' : `Season · ${tab}`;

	return (
		<Panel
			title={title}
			count={rows.length}
			className="season-panel"
			tabs={<Tabs items={TABS} value={tab} onChange={setTab} label="Season table view" />}
			actions={
				rows.length > 0 && (
					<ExportMenu
						title={title}
						notify={notify}
						getCsv={() => [
							['Pos', label, ...rounds.map((r) => r.name), 'Total'],
							...visible.map((r) => [r.pos, r.name, ...rounds.map((_, i) => cellText(cell(i, r.name))), r.total]),
						]}
					/>
				)
			}
		>
			{rounds.length === 0 ? (
				<EmptyState />
			) : visible.length === 0 ? (
				<EmptyState title="No matches" message="Nothing matches the current search or platform filter." />
			) : (
				<div className="table-scroll" key={tab}>
					<table className="season-table">
						<thead>
							<tr>
								<th className="col-pos" scope="col">
									Pos
								</th>
								<th className="col-name" scope="col">
									{label}
								</th>
								{rounds.map((r) => (
									<th key={r.id} className="col-round" scope="col">
										<span className="round-head">
											<span className="round-name" title={`${r.name} · loaded ${formatDateTime(r.loadedAt)}`}>
												{r.name}
											</span>
											<button
												type="button"
												className="round-remove"
												aria-label={`Remove ${r.name}`}
												title={`Remove ${r.name}`}
												onClick={() => onRemoveRound(r)}
											>
												<CloseIcon size={14} />
											</button>
										</span>
									</th>
								))}
								<th className="col-total" scope="col">
									Total
								</th>
							</tr>
						</thead>
						<tbody>
							{visible.map((r, index) => (
								<Fragment key={r.name}>
								<tr
									className={`${isTeams ? '' : 'is-selectable'}${expanded === r.name ? ' is-expanded' : ''}`}
									style={{ '--i': Math.min(index, 20) }}
									{...selectableRow(r.name, isTeams ? undefined : toggle, expanded === r.name)}
								>
									<td className="col-pos">
										<Badge rank={r.pos} />
									</td>
									<th className="col-name" scope="row">
										<NameCell
											name={r.name}
											driver={!isTeams}
											nat={isTeams ? undefined : teamsByUser[r.name]?.nat}
											platform={isTeams ? undefined : platformOf[r.name]}
											className="cell-name"
										/>
									</th>
									{rounds.map((round, i) => {
										const c = cell(i, r.name);
										return (
											<td key={round.id} className="col-round">
												{!c ? (
													<span className="cell-empty" aria-label="Did not start">
														·
													</span>
												) : c.dnf ? (
													<span className="cell-dnf">DNF</span>
												) : (
													<>
														<span className="cell-points">{c.points}</span>
														{c.place && <span className="cell-place">P{c.place}</span>}
													</>
												)}
											</td>
										);
									})}
									<td className="col-total">{r.total}</td>
								</tr>
								{!isTeams && expanded === r.name && (
									<tr className="season-detail-row">
										<td colSpan={rounds.length + 3}>
											<div className="season-detail">{renderDetail(r.name, close, CATEGORIES.includes(tab) ? tab : undefined)}</div>
										</td>
									</tr>
								)}
								</Fragment>
							))}
						</tbody>
					</table>
				</div>
			)}
		</Panel>
	);
}
