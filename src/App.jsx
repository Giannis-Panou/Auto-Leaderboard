import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import LoadPanel from './components/LoadPanel';
import FilterBar from './components/FilterBar';
import Tabs from './components/Tabs';
import SeasonTable from './components/SeasonTable';
import DriverDetail from './components/DriverDetail';
import { Toasts, useConfirm, useToasts } from './components/Feedback';
import { FlagIcon, GridIcon, TableIcon, TrophyIcon } from './components/Icons';
import { ResultsPanel, Standings } from './components/Leaderboards';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useMediaQuery } from './hooks/useMediaQuery';
import { csvToJson, isTeamsFile, teamCsvToJson } from './lib/csv';
import { DEMO_TEAMS_FILE, DEMOS } from './lib/demos';
import { CATEGORIES, POINTS_SYSTEM_OPTIONS, TEAM_SCORER_OPTIONS } from './lib/pointsSystems';
import {
	computeSeason,
	DEFAULT_SETTINGS,
	isRealTeam,
	mergeRoundFiles,
	roundFingerprint,
	scoreRound,
	sortByPointsDesc,
} from './lib/season';

const CATEGORY_TABS = CATEGORIES.map((c) => ({ value: c, label: c }));
const RESULT_TABS = [{ value: 'OVERALL', label: 'Overall' }, ...CATEGORY_TABS];
const DESKTOP_VIEWS = [
	{ value: 'event', label: 'Event' },
	{ value: 'season', label: 'Season' },
];
const MOBILE_VIEWS = [
	{ value: 'event', label: 'Event', icon: <FlagIcon /> },
	{ value: 'categories', label: 'Categories', icon: <GridIcon /> },
	{ value: 'standings', label: 'Standings', icon: <TrophyIcon /> },
	{ value: 'season', label: 'Season', icon: <TableIcon /> },
];

// Storage keys from before rounds were kept individually.
const LEGACY_KEYS = [
	'leaderboard',
	'teamLeaderboard',
	'timeLeaderboard',
	'categories',
	'prevLeaderboard',
	'prevTeamLeaderboard',
	'categoryStandings',
	'prevCategoryStandings',
];

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export default function App() {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const { toasts, notify, dismiss } = useToasts();
	const [confirm, confirmDialog] = useConfirm();

	// ---- Persisted data: teams, every loaded round, settings ----------------
	const [teams, setTeams] = useLocalStorage('teams', [], Array.isArray);
	const [rounds, setRounds] = useLocalStorage('rounds', [], Array.isArray);
	const [storedSettings, setStoredSettings] = useLocalStorage('settings', DEFAULT_SETTINGS, isPlainObject);
	const settings = { ...DEFAULT_SETTINGS, ...storedSettings };
	const updateSetting = (key, value) => setStoredSettings((s) => ({ ...DEFAULT_SETTINGS, ...s, [key]: value }));

	useEffect(() => {
		try {
			LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
		} catch {
			// storage unavailable
		}
	}, []);

	// ---- UI state ------------------------------------------------------------
	const [loadId, setLoadId] = useState(0); // bumps on each load to replay the row reveal
	const [selectedRoundId, setSelectedRoundId] = useState(null); // null = latest
	const [resultsTab, setResultsTab] = useState('OVERALL');
	const [categoryTab, setCategoryTab] = useState('CA1');
	const [desktopView, setDesktopView] = useState('event');
	const [mobileView, setMobileView] = useState('event');
	const [uploadOpen, setUploadOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [platform, setPlatform] = useState('ALL');

	// ---- Derived data ----------------------------------------------------------
	const teamsByUser = useMemo(() => Object.fromEntries(teams.map((t) => [t.username, t])), [teams]);

	const season = useMemo(
		() => computeSeason(rounds, teamsByUser, settings),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[rounds, teamsByUser, settings.pointsSystem, settings.teamScorers, settings.dnfCutoff]
	);

	// Latest known platform per driver (results file first, teams file as fallback).
	const platformOf = useMemo(() => {
		const map = Object.fromEntries(teams.filter((t) => t.platform).map((t) => [t.username, t.platform]));
		rounds.forEach((r) => r.results.forEach((e) => e.platform && (map[e.username] = e.platform)));
		return map;
	}, [teams, rounds]);

	const filter = useMemo(() => {
		const q = search.trim().toLowerCase();
		const text = (value) => !q || (value || '').toLowerCase().includes(q);
		return {
			matchesDriver: (name, team, driverPlatform) =>
				(text(name) || (q && text(team))) && (platform === 'ALL' || driverPlatform === platform),
			matchesTeam: (team) => text(team),
		};
	}, [search, platform]);

	const latestRound = season.rounds.at(-1);
	const eventRound = season.rounds.find((r) => r.id === selectedRoundId) || latestRound;
	const pointsLabel = POINTS_SYSTEM_OPTIONS.find((o) => o.value === settings.pointsSystem)?.label;
	const exportSubtitle = latestRound ? `After ${latestRound.name} · ${pointsLabel} points` : '';

	// Live season state for the header's timing blocks.
	const headerStatus = useMemo(() => {
		const [leaderName, leaderPoints] = sortByPointsDesc(season.standings.drivers)[0] || [];
		return {
			round: latestRound,
			leader: leaderName ? { name: leaderName, points: leaderPoints } : null,
			rounds: season.rounds.length,
			drivers: Object.keys(season.standings.drivers).length,
			teams: Object.keys(season.standings.teams).filter(isRealTeam).length,
		};
	}, [season, latestRound]);

	// ---- Loading ---------------------------------------------------------------
	// Load teams (optional) and a round made of one or more result files.
	const ingest = async ({ teamTexts = [], resultFiles = [], roundName = '' }) => {
		let currentTeams = teams;
		teamTexts.forEach((text) => {
			const parsed = teamCsvToJson(text);
			if (parsed.length) currentTeams = parsed;
			else notify('The teams file has no drivers in it — check the format.', 'error');
		});
		if (currentTeams !== teams) setTeams(currentTeams);
		if (resultFiles.length === 0) return;

		const parsedFiles = [];
		resultFiles.forEach(({ name, text }) => {
			const rows = csvToJson(text);
			if (rows.length) parsedFiles.push({ name, rows });
			else notify(`${name}: no valid results found — check the file format.`, 'error');
		});
		if (parsedFiles.length === 0) return;

		const results = mergeRoundFiles(parsedFiles);
		const fingerprint = roundFingerprint(results);
		const existing = rounds.find((r) => r.fingerprint === fingerprint);
		if (existing) {
			notify(`These results are already loaded as “${existing.name}”.`, 'warning');
			return;
		}

		const name = roundName.trim() || `Round ${rounds.length + 1}`;
		const round = {
			id: newId(),
			name,
			loadedAt: new Date().toISOString(),
			files: parsedFiles.map((f) => f.name),
			fingerprint,
			results,
		};
		setRounds((prev) => [...prev, round]);
		setSelectedRoundId(null);
		setLoadId((n) => n + 1);
		setUploadOpen(false);

		const known = Object.fromEntries(currentTeams.map((t) => [t.username, t]));
		const unknown = results.filter((r) => !known[r.username]).length;
		const dnfs = scoreRound(round, known, settings).entries.filter((e) => e.dnf).length;
		notify(
			[`${name}: ${results.length} drivers loaded`, dnfs && `${dnfs} DNF`, unknown && `${unknown} not in teams.csv`]
				.filter(Boolean)
				.join(' · '),
			'success'
		);
	};

	const handleUpload = async (files, roundName) => {
		const teamFiles = files.filter((f) => isTeamsFile(f.name));
		const csvFiles = files.filter((f) => !isTeamsFile(f.name));

		const teamTexts = await Promise.all(teamFiles.map((f) => f.text()));
		const resultFiles = await Promise.all(csvFiles.map(async (f) => ({ name: f.name, text: await f.text() })));
		await ingest({ teamTexts, resultFiles, roundName });

		if (csvFiles.length === 0 && teamTexts.length) {
			notify(`Teams loaded: ${teamCsvToJson(teamTexts.at(-1)).length} drivers.`, 'success');
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
				resultFiles: demo.files.map((file, i) => ({ name: file, text: resultTexts[i] })),
				roundName: demo.roundName,
			});
		} catch (error) {
			console.error('Failed to load demo results:', error);
			notify('Could not load the demo results. Please try again.', 'error');
		}
	};

	// ---- Removing --------------------------------------------------------------
	const handleRemoveRound = async (round) => {
		const ok = await confirm({
			title: 'Remove round?',
			message: `“${round.name}” and the points it awarded will be removed from the season.`,
			confirmLabel: 'Remove round',
		});
		if (!ok) return;
		setRounds((prev) => prev.filter((r) => r.id !== round.id));
		if (selectedRoundId === round.id) setSelectedRoundId(null);
		notify(`${round.name} removed.`, 'info');
	};

	const handleRemoveAllRounds = async () => {
		if (rounds.length === 0) return notify('There are no rounds to remove.', 'info');
		const ok = await confirm({
			title: 'Remove all rounds?',
			message: `All ${rounds.length} rounds and every point will be cleared. The teams list is kept.`,
			confirmLabel: 'Remove all rounds',
		});
		if (!ok) return;
		setRounds([]);
		setSelectedRoundId(null);
		notify('All rounds removed.', 'info');
	};

	const handleDeleteAll = async () => {
		const ok = await confirm({
			title: 'Delete all data?',
			message: 'Every round and the teams list will be deleted from this browser. This can’t be undone.',
			confirmLabel: 'Delete everything',
		});
		if (!ok) return;
		setRounds([]);
		setTeams([]);
		setSelectedRoundId(null);
		notify('All data deleted.', 'info');
	};

	// Driver profile, rendered inline under whichever row was clicked.
	// `category` is the category tab it was opened from (undefined for overall views).
	const renderDetail = (username, close, category) => (
		<DriverDetail
			username={username}
			season={season}
			teamsByUser={teamsByUser}
			platformOf={platformOf}
			contextCategory={category}
			onClose={close}
		/>
	);

	// ---- Pieces ----------------------------------------------------------------
	const loadPanel = (
		<LoadPanel
			settings={settings}
			onSettingChange={updateSetting}
			onUpload={handleUpload}
			demos={DEMOS}
			onLoadDemo={handleLoadDemo}
		/>
	);
	const rulesSummary = [
		`${pointsLabel} points`,
		TEAM_SCORER_OPTIONS.find((o) => o.value === settings.teamScorers)?.label.replace('Drivers', 'team scorers'),
		settings.dnfCutoff ? `DNF over ${settings.dnfCutoff}%` : 'no DNF cut-off',
	].join(' · ');
	const filterBar = (
		<FilterBar
			views={isMobile ? undefined : DESKTOP_VIEWS}
			view={desktopView}
			onViewChange={setDesktopView}
			search={search}
			onSearch={setSearch}
			platform={platform}
			onPlatform={setPlatform}
		/>
	);

	const resultsProps = {
		round: eventRound,
		rounds: season.rounds,
		onRoundChange: setSelectedRoundId,
		teamsByUser,
		filter,
		renderDetail,
	};
	// With 2+ rounds the round picker next to the title already names the round.
	const roundTitle = (suffix) =>
		eventRound && season.rounds.length < 2 ? `${eventRound.name} · ${suffix}` : suffix;

	const standings = (
		<Standings
			season={season}
			teamsByUser={teamsByUser}
			platformOf={platformOf}
			filter={filter}
			subtitle={exportSubtitle}
			renderDetail={renderDetail}
			notify={notify}
		/>
	);

	const seasonTable = (
		<SeasonTable
			season={season}
			teamsByUser={teamsByUser}
			platformOf={platformOf}
			filter={filter}
			renderDetail={renderDetail}
			onRemoveRound={handleRemoveRound}
			onRemoveAllRounds={handleRemoveAllRounds}
			onDeleteAll={handleDeleteAll}
			notify={notify}
		/>
	);

	return (
		<div className="app">
			<Header status={headerStatus} />

			{isMobile ? (
				<>
					<button
						type="button"
						className={`btn load-toggle ${uploadOpen ? 'btn-ghost' : 'btn-accent'}`}
						aria-expanded={uploadOpen}
						onClick={() => setUploadOpen((o) => !o)}
					>
						<span>{uploadOpen ? 'Close' : '+ Load a round'}</span>
					</button>
					{uploadOpen ? loadPanel : <p className="rules-summary">Scoring: {rulesSummary}</p>}
					{filterBar}

					<main className="mobile-view" key={mobileView}>
						{mobileView === 'event' && (
							<ResultsPanel {...resultsProps} title={roundTitle('Overall')} listKey={`overall-${loadId}-${eventRound?.id}`} />
						)}
						{mobileView === 'categories' && (
							<ResultsPanel
								{...resultsProps}
								title={roundTitle(categoryTab)}
								category={categoryTab}
								tabs={<Tabs items={CATEGORY_TABS} value={categoryTab} onChange={setCategoryTab} label="Category" />}
								listKey={`${categoryTab}-${loadId}-${eventRound?.id}`}
							/>
						)}
						{mobileView === 'standings' && standings}
						{mobileView === 'season' && seasonTable}
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
					{loadPanel}
					{filterBar}
					{desktopView === 'event' ? (
						<main className="board-grid">
							<ResultsPanel
								{...resultsProps}
								title={roundTitle(resultsTab === 'OVERALL' ? 'Overall' : resultsTab)}
								category={resultsTab === 'OVERALL' ? undefined : resultsTab}
								tabs={<Tabs items={RESULT_TABS} value={resultsTab} onChange={setResultsTab} label="Results view" />}
								listKey={`${resultsTab}-${loadId}-${eventRound?.id}`}
							/>
							<div className="standings">{standings}</div>
						</main>
					) : (
						<main className="season-view">{seasonTable}</main>
					)}
				</>
			)}

			{confirmDialog}
			<Toasts toasts={toasts} onDismiss={dismiss} />
		</div>
	);
}
