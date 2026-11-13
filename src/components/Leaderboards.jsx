import { useRef, useState } from 'react';
import { CountUp, Delta, deltaText, DetailItem, List, Panel, Row, useExpandedDriver } from './Leaderboard';
import ExportMenu from './ExportMenu';
import Tabs from './Tabs';
import { useFlip } from '../hooks/useFlip';
import { formatGap, formatPace, formatTime } from '../lib/format';
import { isRealTeam, rankMap, sortByPointsDesc } from '../lib/season';
import { CATEGORIES } from '../lib/pointsSystems';

const NO_MATCHES = { emptyTitle: 'No matches', emptyMessage: 'No drivers match the current search or platform filter.' };

function RoundSelect({ rounds, value, onChange }) {
	if (rounds.length < 2) return null;
	return (
		<label className="round-select">
			<span className="visually-hidden">Round</span>
			<span className="select-wrap">
				<select value={value} onChange={(e) => onChange(e.target.value)}>
					{rounds.map((r) => (
						<option key={r.id} value={r.id}>
							{r.name}
						</option>
					))}
				</select>
			</span>
		</label>
	);
}

// One round's results (overall, or a category). Positions only count
// finishers; the leader shows the full time and everyone else the gap.
export function ResultsPanel({
	title,
	tabs,
	round,
	rounds,
	onRoundChange,
	category,
	teamsByUser,
	filter,
	renderDetail,
	listKey,
}) {
	const [expanded, toggle, close] = useExpandedDriver();
	const all = round ? round.entries.filter((e) => !category || e.category === category) : [];
	const placeOf = (e) => (category ? e.categoryPlace : e.place);
	const leaderTime = all.find((e) => !e.dnf)?.time;
	const visible = all.filter((e) => filter.matchesDriver(e.username, e.team, e.platform));
	const filtered = visible.length !== all.length;

	return (
		<Panel
			title={title}
			count={all.length}
			tabs={tabs}
			className="results-panel"
			actions={round && <RoundSelect rounds={rounds} value={round.id} onChange={onRoundChange} />}
		>
			<List key={listKey} {...(filtered && NO_MATCHES)}>
				{visible.flatMap((entry, index) => [
					<Row
						key={entry.username}
						index={index}
						rank={entry.dnf ? '–' : placeOf(entry)}
						name={entry.username}
						driver
						nat={teamsByUser[entry.username]?.nat}
						platform={entry.platform}
						onSelect={toggle}
						expanded={expanded === entry.username}
						sub={entry.car}
						chip={category ? undefined : entry.category}
						dnf={entry.dnf}
						value={
							entry.dnf
								? 'DNF'
								: entry.time === leaderTime
									? formatTime(entry.time)
									: formatGap(entry.time - leaderTime)
						}
						valueTitle={`${formatTime(entry.time)} · ${formatPace(entry.pct)} of winner`}
						muted={entry.time !== leaderTime}
					/>,
					expanded === entry.username && (
						<DetailItem key={`${entry.username}-detail`}>{renderDetail(entry.username, close, category)}</DetailItem>
					),
				])}
			</List>
		</Panel>
	);
}

function StandingsPanel({ title, exportTitle, subtitle, board, prevBoard, rowProps, matches, tabs, switcher, listKey, notify, renderDetail, detailCategory }) {
	const listRef = useRef(null);
	const [expanded, toggle, close] = useExpandedDriver();
	useFlip(listRef, listKey);

	const prevRanks = prevBoard ? rankMap(prevBoard) : {};
	const rows = sortByPointsDesc(board).map(([name, points], i) => {
		const prevRank = prevRanks[name];
		return { name, points, rank: i + 1, change: prevRank ? prevRank - (i + 1) : undefined };
	});
	const visible = rows.filter((r) => matches(r.name));

	const imageRows = () =>
		visible.map((r) => {
			const props = rowProps(r.name);
			return { rank: r.rank, name: r.name, sub: props.sub, chip: props.chip, value: r.points, delta: deltaText(r.change) };
		});

	return (
		<Panel
			title={title}
			count={rows.length}
			tabs={tabs}
			className="standings-panel"
			actions={
				<>
					{switcher}
					{rows.length > 0 && (
						<ExportMenu
							title={exportTitle}
							notify={notify}
							getImage={() => ({ title: exportTitle, subtitle, rows: imageRows() })}
							getCsv={() => [
								['Pos', 'Name', 'Team', 'Category', 'Points', 'Change'],
								...imageRows().map((r) => [r.rank, r.name, r.sub || '', r.chip || '', r.value, r.delta]),
							]}
						/>
					)}
				</>
			}
		>
			<List key={listKey} listRef={listRef} {...(visible.length !== rows.length && NO_MATCHES)}>
				{visible.flatMap((r, index) => [
					<Row
						key={r.name}
						index={index}
						rank={r.rank}
						name={r.name}
						{...rowProps(r.name)}
						onSelect={renderDetail ? toggle : undefined}
						expanded={expanded === r.name}
						value={<CountUp value={r.points} />}
						delta={<Delta change={r.change} />}
					/>,
					renderDetail && expanded === r.name && (
						<DetailItem key={`${r.name}-detail`}>{renderDetail(r.name, close, detailCategory)}</DetailItem>
					),
				])}
			</List>
		</Panel>
	);
}

const STANDINGS_TABS = [{ value: 'ALL', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))];

const KIND_TABS = [
	{ value: 'drivers', label: 'Drivers' },
	{ value: 'teams', label: 'Teams' },
];

// One standings panel with a Drivers / Teams switch. The driver category tab
// is kept here so it survives switching to Teams and back.
export function Standings(props) {
	const [kind, setKind] = useState('drivers');
	const [category, setCategory] = useState('ALL');
	const switcher = (
		<Tabs items={KIND_TABS} value={kind} onChange={setKind} label="Standings type" className="segmented standings-switch" />
	);

	return kind === 'drivers' ? (
		<DriverStandings {...props} category={category} onCategoryChange={setCategory} switcher={switcher} />
	) : (
		<TeamStandings {...props} switcher={switcher} />
	);
}

// Driver standings: "All" is the overall table; each category tab is that
// category's own table, scored on finishing positions within it.
function DriverStandings({ season, teamsByUser, platformOf, filter, subtitle, renderDetail, notify, category, onCategoryChange, switcher }) {
	const setCategory = onCategoryChange;
	const isAll = category === 'ALL';
	const { standings, previous } = season;
	const title = isAll ? 'Driver standings' : `${category} driver standings`;

	return (
		<StandingsPanel
			title={title}
			exportTitle={title}
			subtitle={subtitle}
			board={isAll ? standings.drivers : standings.categories[category] || {}}
			prevBoard={previous && (isAll ? previous.drivers : previous.categories[category] || {})}
			listKey={category}
			notify={notify}
			switcher={switcher}
			renderDetail={renderDetail}
			detailCategory={isAll ? undefined : category}
			matches={(name) => filter.matchesDriver(name, teamsByUser[name]?.team, platformOf[name])}
			tabs={<Tabs items={STANDINGS_TABS} value={category} onChange={setCategory} label="Driver standings category" />}
			rowProps={(name) => ({
				driver: true,
				nat: teamsByUser[name]?.nat,
				platform: platformOf[name],
				sub: teamsByUser[name]?.team,
				chip: isAll ? teamsByUser[name]?.category : undefined,
			})}
		/>
	);
}

// Team standings come from the overall results only; Privateers are excluded.
function TeamStandings({ season, filter, subtitle, notify, switcher }) {
	const onlyTeams = (board) => Object.fromEntries(Object.entries(board).filter(([team]) => isRealTeam(team)));
	const { standings, previous } = season;

	return (
		<StandingsPanel
			title="Team standings"
			exportTitle="Team standings"
			subtitle={subtitle}
			board={onlyTeams(standings.teams)}
			prevBoard={previous && onlyTeams(previous.teams)}
			listKey="teams"
			notify={notify}
			switcher={switcher}
			matches={filter.matchesTeam}
			rowProps={() => ({})}
		/>
	);
}
