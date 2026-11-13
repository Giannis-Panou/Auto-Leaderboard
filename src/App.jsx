import { useMemo, useState } from 'react';
import Header, { Settings } from './components/Header';
import UploadBar from './components/UploadBar';
import Tabs from './components/Tabs';
import { FlagIcon, GridIcon, TrophyIcon } from './components/Icons';
import { DriverStandings, ResultsPanel, TeamStandings } from './components/Leaderboards';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useMediaQuery } from './hooks/useMediaQuery';
import { csvToJson, isTeamsFile, teamCsvToJson } from './lib/csv';
import {
	addCategoryPoints,
	addPoints,
	buildCategories,
	buildTimeLeaderboard,
	combineResults,
	enrichResults,
	scoreCategories,
	scoreEvent,
	zeroCategoryPoints,
	zeroPoints,
} from './lib/leaderboard';
import { CATEGORIES } from './lib/pointsSystems';

import { DEMO_TEAMS_FILE, DEMOS } from './lib/demos';

const CATEGORY_TABS = CATEGORIES.map((c) => ({ value: c, label: c }));
const RESULT_TABS = [{ value: 'OVERALL', label: 'Overall' }, ...CATEGORY_TABS];
const MOBILE_VIEWS = [
	{ value: 'event', label: 'Event', icon: <FlagIcon /> },
	{ value: 'categories', label: 'Categories', icon: <GridIcon /> },
	{ value: 'standings', label: 'Standings', icon: <TrophyIcon /> },
];

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export default function App() {
	const isMobile = useMediaQuery('(max-width: 768px)');

	const [pointsSystem, setPointsSystem] = useState('WRC');
	const [teamScorers, setTeamScorers] = useState('Two');

	const [teams, setTeams] = useLocalStorage('teams', [], Array.isArray);
	const [leaderboard, setLeaderboard] = useLocalStorage('leaderboard', {}, isPlainObject);
	const [teamLeaderboard, setTeamLeaderboard] = useLocalStorage('teamLeaderboard', {}, isPlainObject);
	const [timeLeaderboard, setTimeLeaderboard] = useLocalStorage('timeLeaderboard', {}, isPlainObject);
	const [categories, setCategories] = useLocalStorage('categories', {}, isPlainObject);
	// Standings before the latest round, for the ▲/▼ position arrows.
	const [prevLeaderboard, setPrevLeaderboard] = useLocalStorage('prevLeaderboard', {}, isPlainObject);
	const [prevTeamLeaderboard, setPrevTeamLeaderboard] = useLocalStorage('prevTeamLeaderboard', {}, isPlainObject);
	// Independent per-category driver points: { CA1: { drivers: {...} }, ... }
	const [categoryStandings, setCategoryStandings] = useLocalStorage('categoryStandings', {}, isPlainObject);
	const [prevCategoryStandings, setPrevCategoryStandings] = useLocalStorage('prevCategoryStandings', {}, isPlainObject);

	// UI state
	const [loadId, setLoadId] = useState(0); // bumps on each load to replay the row reveal
	const [resultsTab, setResultsTab] = useState('OVERALL');
	const [categoryTab, setCategoryTab] = useState('CA1');
	const [mobileView, setMobileView] = useState('event');
	const [uploadOpen, setUploadOpen] = useState(false);

	const teamsByUser = useMemo(
		() => Object.fromEntries(teams.map((t) => [t.username, t])),
		[teams]
	);

	const overallEntries = useMemo(
		() =>
			Object.entries(timeLeaderboard)
				.map(([username, entry]) => ({ key: username, username, ...entry }))
				.sort((a, b) => a.time - b.time),
		[timeLeaderboard]
	);

	const categoryEntries = (cat) =>
		(Array.isArray(categories[cat]) ? categories[cat] : []).map((p, i) => ({
			key: `${p.source}-${p.username}-${i}`,
			...p,
		}));

	// Load teams (optional) and one or more result files, then update every board.
	const ingest = async ({ teamTexts = [], resultFiles = [] }) => {
		let currentTeams = teams;

		teamTexts.forEach((text) => {
			try {
				currentTeams = teamCsvToJson(text);
			} catch (error) {
				console.error('Error processing Teams CSV:', error);
			}
		});
		if (currentTeams !== teams) setTeams(currentTeams);

		if (resultFiles.length === 0) return;

		const parsedFiles = resultFiles.flatMap(({ name, text }) => {
			const rows = csvToJson(text);
			if (rows.length === 0) {
				alert(
					`Error processing file ${name}: no valid results could be parsed.\n\nPlease check that the file has the correct format.`
				);
				return [];
			}
			return [enrichResults(rows, currentTeams, name)];
		});

		if (parsedFiles.length === 0) {
			alert('No valid results files found.');
			return;
		}

		const results = combineResults(parsedFiles);
		const { driverPoints, teamPoints } = scoreEvent(results, pointsSystem, teamScorers);
		const categoryScores = scoreCategories(results, pointsSystem);

		setPrevLeaderboard(leaderboard);
		setPrevTeamLeaderboard(teamLeaderboard);
		setPrevCategoryStandings(categoryStandings);
		setLeaderboard((prev) => addPoints(prev, driverPoints));
		setTeamLeaderboard((prev) => addPoints(prev, teamPoints));
		setCategoryStandings((prev) => addCategoryPoints(prev, categoryScores));
		setTimeLeaderboard(buildTimeLeaderboard(results));
		setCategories(buildCategories(results));
		setLoadId((n) => n + 1);
		setUploadOpen(false);
	};

	const handleUpload = async (files) => {
		if (files.length === 0) {
			alert('Please select a file to upload.');
			return;
		}

		const teamFiles = files.filter((f) => isTeamsFile(f.name));
		const csvFiles = files.filter((f) => f.name.endsWith('.csv') && !isTeamsFile(f.name));

		const teamTexts = await Promise.all(teamFiles.map((f) => f.text()));
		const resultFiles = await Promise.all(
			csvFiles.map(async (f) => ({ name: f.name, text: await f.text() }))
		);

		await ingest({ teamTexts, resultFiles });

		if (csvFiles.length === 0) {
			alert(teamFiles.length > 0 ? 'Teams loaded successfully.' : 'Please select a valid CSV file.');
		}
	};

	const handleLoadDemo = async (demo) => {
		const base = `${import.meta.env.BASE_URL}demoresults/`;
		try {
			const fetchText = async (path) => {
				const res = await fetch(base + path);
				if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
				return res.text();
			};
			const [teamsText, ...resultTexts] = await Promise.all([
				fetchText(DEMO_TEAMS_FILE),
				...demo.files.map((file) => fetchText(`${demo.folder}/${file}`)),
			]);
			await ingest({
				teamTexts: [teamsText],
				resultFiles: demo.files.map((file, i) => ({
					name: `${demo.folder}/${file}`,
					text: resultTexts[i],
				})),
			});
		} catch (error) {
			console.error('Failed to load demo results:', error);
			alert('Could not load demo results. Please try again.');
		}
	};

	const handleClearPoints = () => {
		if (!confirm('Are you sure you want to clear all points?')) return;
		setLeaderboard((prev) => zeroPoints(prev));
		setTeamLeaderboard((prev) => zeroPoints(prev));
		setCategoryStandings((prev) => zeroCategoryPoints(prev));
		setPrevLeaderboard({});
		setPrevTeamLeaderboard({});
		setPrevCategoryStandings({});
		setTimeLeaderboard({});
		setCategories({});
	};

	const handleDeleteAll = () => {
		if (!confirm('Are you sure you want to delete all data?')) return;
		setLeaderboard({});
		setTeamLeaderboard({});
		setCategoryStandings({});
		setPrevLeaderboard({});
		setPrevTeamLeaderboard({});
		setPrevCategoryStandings({});
		setTimeLeaderboard({});
		setCategories({});
	};

	const settings = (
		<Settings
			pointsSystem={pointsSystem}
			onPointsSystemChange={setPointsSystem}
			teamScorers={teamScorers}
			onTeamScorersChange={setTeamScorers}
		/>
	);

	const uploadBar = (
		<UploadBar onUpload={handleUpload} demos={DEMOS} onLoadDemo={handleLoadDemo} />
	);

	const standings = (
		<>
			<DriverStandings
				leaderboard={leaderboard}
				prevLeaderboard={prevLeaderboard}
				categoryStandings={categoryStandings}
				prevCategoryStandings={prevCategoryStandings}
				teamsByUser={teamsByUser}
			/>
			<TeamStandings
				teamLeaderboard={teamLeaderboard}
				prevTeamLeaderboard={prevTeamLeaderboard}
			/>
		</>
	);

	return (
		<div className="app">
			<Header
				isMobile={isMobile}
				settings={settings}
				onClearPoints={handleClearPoints}
				onDeleteAll={handleDeleteAll}
			/>

			{isMobile ? (
				<>
					<button
						type="button"
						className={`btn load-toggle ${uploadOpen ? 'btn-ghost' : 'btn-accent'}`}
						aria-expanded={uploadOpen}
						onClick={() => setUploadOpen((o) => !o)}
					>
						<span>{uploadOpen ? 'Close' : '+ Load results'}</span>
					</button>
					{uploadOpen && uploadBar}

					<main className="mobile-view" key={mobileView}>
						{mobileView === 'event' && (
							<ResultsPanel
								title="Overall time"
								entries={overallEntries}
								showChip
								teamsByUser={teamsByUser}
								listKey={`overall-${loadId}`}
							/>
						)}
						{mobileView === 'categories' && (
							<ResultsPanel
								title={`${categoryTab} results`}
								tabs={
									<Tabs
										items={CATEGORY_TABS}
										value={categoryTab}
										onChange={setCategoryTab}
										label="Category"
									/>
								}
								entries={categoryEntries(categoryTab)}
								teamsByUser={teamsByUser}
								listKey={`${categoryTab}-${loadId}`}
							/>
						)}
						{mobileView === 'standings' && standings}
					</main>

					<nav className="tabbar" aria-label="Sections">
						<Tabs
							items={MOBILE_VIEWS}
							value={mobileView}
							onChange={(view) => {
								setMobileView(view);
								window.scrollTo({ top: 0 });
							}}
							label="Sections"
						/>
					</nav>
				</>
			) : (
				<>
					{uploadBar}
					<main className="board-grid">
						<ResultsPanel
							title={resultsTab === 'OVERALL' ? 'Overall time' : `${resultsTab} results`}
							tabs={
								<Tabs
									items={RESULT_TABS}
									value={resultsTab}
									onChange={setResultsTab}
									label="Results view"
								/>
							}
							entries={
								resultsTab === 'OVERALL' ? overallEntries : categoryEntries(resultsTab)
							}
							showChip={resultsTab === 'OVERALL'}
							teamsByUser={teamsByUser}
							listKey={`${resultsTab}-${loadId}`}
						/>
						<div className="standings">{standings}</div>
					</main>
				</>
			)}
		</div>
	);
}
