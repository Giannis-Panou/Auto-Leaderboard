import { useRef, useState } from 'react';
import { CountUp, Delta, List, Panel, Row } from './Leaderboard';
import Tabs from './Tabs';
import { CATEGORIES } from '../lib/pointsSystems';
import { useFlip } from '../hooks/useFlip';
import { formatGap, formatTime } from '../lib/format';
import { isRealTeam, rankMap, sortByPointsDesc } from '../lib/leaderboard';

// Event results (overall or one category): leader shows full time, everyone
// else shows the gap to the leader.
export function ResultsPanel({ title, tabs, entries, showChip, teamsByUser, listKey }) {
	const leaderTime = entries[0]?.time;

	return (
		<Panel title={title} count={entries.length} tabs={tabs} className="results-panel">
			<List key={listKey}>
				{entries.map((entry, index) => {
					const isLeader = index === 0;
					const chip = showChip
						? entry.category || teamsByUser[entry.username]?.category
						: undefined;
					return (
						<Row
							key={entry.key}
							index={index}
							rank={index + 1}
							name={entry.username}
							sub={entry.car}
							chip={chip}
							value={isLeader ? formatTime(entry.time) : formatGap(entry.time - leaderTime)}
							valueTitle={formatTime(entry.time)}
							muted={!isLeader}
						/>
					);
				})}
			</List>
		</Panel>
	);
}

const STANDINGS_TABS = [
	{ value: 'ALL', label: 'All' },
	...CATEGORIES.map((c) => ({ value: c, label: c })),
];

function StandingsPanel({ title, board, prevBoard, renderDetails, tabs, listKey }) {
	const listRef = useRef(null);
	useFlip(listRef, listKey);

	const sorted = sortByPointsDesc(board);
	const prevRanks = rankMap(prevBoard);

	return (
		<Panel title={title} count={sorted.length} tabs={tabs} className="standings-panel">
			<List key={listKey} listRef={listRef}>
				{sorted.map(([name, points], index) => {
					const prevRank = prevRanks[name];
					return (
						<Row
							key={name}
							index={index}
							rank={index + 1}
							name={name}
							{...renderDetails(name)}
							value={<CountUp value={points} />}
							delta={<Delta change={prevRank ? prevRank - (index + 1) : undefined} />}
						/>
					);
				})}
			</List>
		</Panel>
	);
}

// Driver standings with All / CA1–CA4 tabs. "All" is the overall points
// table; each category tab is that category's own table, scored on
// finishing positions within the category.
export function DriverStandings({ leaderboard, prevLeaderboard, categoryStandings, prevCategoryStandings, teamsByUser }) {
	const [category, setCategory] = useState('ALL');
	const isAll = category === 'ALL';

	return (
		<StandingsPanel
			title={isAll ? 'Driver standings' : `${category} driver standings`}
			board={isAll ? leaderboard : categoryStandings[category]?.drivers || {}}
			prevBoard={isAll ? prevLeaderboard : prevCategoryStandings[category]?.drivers || {}}
			listKey={category}
			tabs={
				<Tabs
					items={STANDINGS_TABS}
					value={category}
					onChange={setCategory}
					label="Driver standings category"
				/>
			}
			renderDetails={(username) => ({
				sub: teamsByUser[username]?.team,
				chip: isAll ? teamsByUser[username]?.category : undefined,
			})}
		/>
	);
}

// Team standings come from the overall results only. Privateers are filtered
// here as well, so boards saved before that rule existed display correctly.
export function TeamStandings({ teamLeaderboard, prevTeamLeaderboard }) {
	const onlyTeams = (board) =>
		Object.fromEntries(Object.entries(board).filter(([team]) => isRealTeam(team)));

	return (
		<StandingsPanel
			title="Team standings"
			board={onlyTeams(teamLeaderboard)}
			prevBoard={onlyTeams(prevTeamLeaderboard)}
			renderDetails={() => ({})}
		/>
	);
}
