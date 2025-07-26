// Points System
const pointsSystem = {
	WRC: [25, 17, 15, 12, 10, 8, 6, 4, 2, 1],
	WRC_Powerstage: [5, 4, 3, 2, 1],
	Rallycross: [20, 16, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
	F1: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
	F1_Sprint: [8, 7, 6, 5, 4, 3, 2, 1],
};

// Points Contributors per Team
const teamPointsSystem = {
	Two: 2,
	Three: 3,
	Four: 4,
};

let selectedPointsSystem = 'WRC';
let selectedTeamPointsSystem = 'Two';
let leaderboard = {};
let teamLeaderboard = {};
let timeleaderboard = {};
let multipleResults = {};
let pendingFiles = new Set();

// FILE PROCESSING -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Process CSV
function processCsv(file) {
	const reader = new FileReader();

	reader.onload = function (event) {
		try {
			const csvResults = event.target.result;
			const teamsFromStorage = JSON.parse(localStorage.getItem('teams')) || [];
			const jsonResults = csvToJson(csvResults, teamsFromStorage);

			const combinedResults = jsonResults.map((player) => {
				const teamEntry = teamsFromStorage.find(
					(team) => team.username === player.username
				);
				return {
					...player,
					team: teamEntry ? teamEntry.team : 'Unknown',
					source: file.name,
				};
			});

			multipleResults[file.name] = combinedResults;
			pendingFiles.delete(file.name);

			console.log(
				`Processed file: ${file.name}, ${combinedResults.length} results.`
			);

			if (pendingFiles.size === 0) {
				processAllResults();
			}
		} catch (error) {
			console.error(`Error processing file ${file.name}:`, error);
			alert(`Error processing file ${file.name}. Please check the format.`);
			pendingFiles.delete(file.name);
			if (pendingFiles.size === 0) {
				processAllResults();
			}
		}
	};

	reader.readAsText(file);
}

function processAllResults() {
	const fileNames = Object.keys(multipleResults);

	if (fileNames.length === 0) {
		alert('No valid results files found.');
		return;
	}

	console.log(`Processing ${fileNames.length} file(s)`, fileNames);

	if (fileNames.length === 1) {
		const singleFile = multipleResults[fileNames[0]];
		console.log(`Single file results: ${singleFile.length} entries.`);
		updateLeaderboard(singleFile);
		updateLeaderboardTimeBased(singleFile);
	} else {
		const multipleFiles = Object.values(multipleResults).flat();
		console.log(
			`Multiple files combined results: ${multipleFiles.length} entries.`
		);

		multipleFiles.sort((a, b) => a.time - b.time);

		multipleFiles.forEach((player, index) => {
			player.place = index + 1; // Assign place based on sorted order
		});

		console.log(
			`Combined results after sorting: ${multipleFiles.length} entries.`
		);

		updateLeaderboard(multipleFiles);
		updateLeaderboardTimeBased(multipleFiles);

		const fileSummary = Object.entries(multipleResults)
			.map(([fileName, results]) => `${fileName}: ${results.length} entries`)
			.join('\n');

		console.log(`Processed files:\n${fileSummary}`);
	}

	multipleResults = {}; // Clear after processing
}

// Process Team CSV
function processTeamCsv(file) {
	const reader = new FileReader();

	reader.onload = function (event) {
		try {
			const csvResults = event.target.result;
			const teams = teamCsvToJson(csvResults);
			localStorage.setItem('teams', JSON.stringify(teams));
		} catch (error) {
			console.error('Error processing Teams CSV:', error);
		}
	};

	reader.readAsText(file);
}

// CSV to JSON
function csvToJson(csv, teamsFromStorage = []) {
	const lines = csv.split('\n').filter((line) => line.trim() !== '');

	return lines.slice(1).flatMap((line) => {
		const values = line.split(',');

		if (values.length >= 3) {
			const place = parseInt(values[0].trim(), 10);
			const username = values[1].trim();
			const timeStr = values[3].trim();

			const parts = timeStr.split(':');
			if (parts.length !== 3) return [];

			const [hours, minutes, seconds] = parts;
			const [sec, ms] = seconds.split('.');
			const totalMs =
				parseInt(hours) * 3600000 +
				parseInt(minutes) * 60000 +
				parseInt(sec) * 1000 +
				(parseInt(ms.slice(0, 3)) || 0); // Take only 3-digit milliseconds

			return {
				place,
				username,
				time: totalMs,
				timeStr,
			};
		}

		return [];
	});
}

// CSV to Team JSON
function teamCsvToJson(csv) {
	const lines = csv.split('\n').filter((line) => line.trim() !== '');

	const teams = lines.slice(1).flatMap((line) => {
		const values = line.split(',');
		if (values.length >= 2) {
			return {
				username: values[1].trim(),
				team: values[2].trim(),
			};
		}
		return [];
	});

	return teams;
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// LEADERBOARD MANIPULATION -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Update leaderboard
function updateLeaderboard(playersResults) {
	const pointsArray = pointsSystem[selectedPointsSystem] || pointsSystem.WRC;
	const teamContr = teamPointsSystem[selectedTeamPointsSystem] || 2;

	const teamScores = {};

	playersResults.forEach((player) => {
		const { username, place, team } = player;
		const points = pointsArray[place - 1] || 0;

		leaderboard[username] = (leaderboard[username] || 0) + points;

		if (team && team !== 'Unknown') {
			if (!teamScores[team]) teamScores[team] = [];
			teamScores[team].push(points);
		}
	});

	Object.keys(teamScores).forEach((team) => {
		const topScores = teamScores[team]
			.sort((a, b) => b - a)
			.slice(0, teamContr);
		const teamPoints = topScores.reduce((acc, score) => acc + score, 0);
		teamLeaderboard[team] = (teamLeaderboard[team] || 0) + teamPoints;
	});

	saveLeaderboard();
	displayLeaderboard();
}

// Update leaderboard based on time
function updateLeaderboardTimeBased(playersResults) {
	playersResults.forEach((player) => {
		const { username, time, timeStr } = player;

		if (!timeleaderboard[username] || time < timeleaderboard[username].time) {
			timeleaderboard[username] = {
				time,
				timeStr,
			};
		}
	});

	localStorage.setItem('timeLeaderboard', JSON.stringify(timeleaderboard));
	displayTimeLeaderboard();
}

// Display leaderboard
function displayLeaderboard() {
	const teamsFromStorage = JSON.parse(localStorage.getItem('teams')) || [];

	const sortedLeaderboard = Object.entries(leaderboard).sort(
		(a, b) => b[1] - a[1]
	);

	const resultsContainer = document.querySelector('.results-container');
	resultsContainer.innerHTML = '';

	if (sortedLeaderboard.length > 0) {
		const leaderboardHtml = sortedLeaderboard
			.map(([username, points], index) => {
				const teamEntry = teamsFromStorage.find(
					(teamObj) => teamObj.username === username
				);

				const team = teamEntry ? teamEntry.team : 'Unknown';

				return `<div class="leaderboard-entry list-group-item d-flex justify-content-between">
							<div class="numberDiv">
								<span class="number">${index + 1}</span>
							</div>
							<div class="players">
								<span>${username}</span>
							</div>
							<div class="justify-content-center teams">
								<span>${team}</span>
							</div>
							<div class="d-flex justify-content-end points">
								<span>${points}</span>
							</div>
					</div>`;
			})
			.join('');

		resultsContainer.innerHTML = `${leaderboardHtml}`;
	}

	const sortedTeamLeaderboard = Object.entries(teamLeaderboard).sort(
		(a, b) => b[1] - a[1]
	);

	const resultsTeamContainer = document.querySelector(
		'.team-results-container'
	);
	resultsTeamContainer.innerHTML = '';

	if (sortedTeamLeaderboard.length > 0) {
		const leaderboardTeamHtml = sortedTeamLeaderboard
			.map(
				([team, points], index) =>
					`<div class="leaderboard-entry list-group-item d-flex justify-content-between">
						<div class="numberDiv">
							<span class="number">${index + 1}</span>
						</div>
						<div class="d-flex flex-grow-1 flex-row players">
							<span>${team}</span>
						</div>
						<div class="d-flex flex-grow-1 justify-content-end points">
							<span>${points}</span>
						</div>
					</div>`
			)
			.join('');

		resultsTeamContainer.innerHTML = `${leaderboardTeamHtml}`;
		podiumStyling();
	}
}

// Display Time leaderboard
function displayTimeLeaderboard() {
	const sorted = Object.entries(timeleaderboard).sort(
		(a, b) => a[1].time - b[1].time
	);

	const resultsContainer = document.querySelector('.time-results-container');
	resultsContainer.innerHTML = '';

	if (sorted.length > 0) {
		const leaderboardHtml = sorted
			.map(([username, timeObj], index) => {
				return `<div class="leaderboard-entry list-group-item d-flex justify-content-between">
				<div class="numberDiv">
					<span class="number">${index + 1}</span>
				</div>
				<div class="players">
					<span>${username}</span>
				</div>
				<div class="d-flex justify-content-end points">
					<span>${trimToThreeDecimals(timeObj.timeStr)}</span>
				</div>
			</div>`;
			})
			.join('');

		resultsContainer.innerHTML = `${leaderboardHtml}`;
	}

	const sortedTeamLeaderboard = Object.entries(teamLeaderboard).sort(
		(a, b) => b[1] - a[1]
	);

	const resultsTeamContainer = document.querySelector(
		'.team-results-container'
	);
	resultsTeamContainer.innerHTML = '';

	if (sortedTeamLeaderboard.length > 0) {
		const leaderboardTeamHtml = sortedTeamLeaderboard
			.map(
				([team, points], index) =>
					`<div class="leaderboard-entry list-group-item d-flex justify-content-between">
						<div class="numberDiv">
							<span class="number">${index + 1}</span>
						</div>
						<div class="d-flex flex-grow-1 flex-row players">
							<span>${team}</span>
						</div>
						<div class="d-flex flex-grow-1 justify-content-end points">
							<span>${points}</span>
						</div>
					</div>`
			)
			.join('');

		resultsTeamContainer.innerHTML = `${leaderboardTeamHtml}`;
		podiumStyling();
	}
}

function trimToThreeDecimals(timeStr) {
	return timeStr.replace(/(\.\d{3})\d*/, '$1');
}

// Save leaderboard to localStorage
function saveLeaderboard() {
	localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
	localStorage.setItem('teamLeaderboard', JSON.stringify(teamLeaderboard));
	localStorage.setItem('timeLeaderboard', JSON.stringify(timeleaderboard));
}

// Load leaderboard from localStorage
function loadLeaderboard() {
	const savedLeaderboard = localStorage.getItem('leaderboard');
	const savedTeamLeaderboard = localStorage.getItem('teamLeaderboard');
	const savedTimeLeaderboard = localStorage.getItem('timeLeaderboard');

	if (savedLeaderboard) {
		leaderboard = JSON.parse(savedLeaderboard);
	}

	if (savedTeamLeaderboard) {
		teamLeaderboard = JSON.parse(savedTeamLeaderboard);
	}

	if (savedTimeLeaderboard) {
		timeleaderboard = JSON.parse(savedTimeLeaderboard);
	}

	displayLeaderboard();
	displayTimeLeaderboard();
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// LOADING AND CLEARING -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Load Results
function loadResults() {
	const csvFileInput = document.getElementById('csv-file');
	const files = csvFileInput.files;

	if (files.length === 0) {
		alert('Please select a file to upload.');
		return;
	}

	multipleResults = {};
	pendingFiles.clear();

	const csvFiles = Array.from(files).filter(
		(file) => file.name.endsWith('.csv') && !file.name.includes('_teams.csv')
	);

	const teamFiles = Array.from(files).filter((file) =>
		file.name.includes('_teams.csv')
	);

	teamFiles.forEach((file) => {
		processTeamCsv(file);
	});

	if (csvFiles.length === 0) {
		if (teamFiles.length > 0) {
			alert('Teams loaded successfully.');
		} else {
			alert('Please select a valid CSV file.');
		}
		csvFileInput.value = '';
		return;
	}

	csvFiles.forEach((file) => {
		pendingFiles.add(file.name);
	});

	csvFiles.forEach((file) => {
		processCsv(file);
	});

	csvFileInput.value = '';
}

// Clear points but keep player names
function clearPoints() {
	Object.keys(leaderboard).forEach((username) => {
		leaderboard[username] = 0;
	});
	saveLeaderboard();
	displayLeaderboard();
	displayTimeLeaderboard();

	Object.keys(teamLeaderboard).forEach((team) => {
		teamLeaderboard[team] = 0;
	});
	saveLeaderboard();
	displayLeaderboard();
	displayTimeLeaderboard();
}

// Clear LocalStorage
function clearLocalStorage() {
	localStorage.removeItem('leaderboard');
	localStorage.removeItem('teamLeaderboard');
	localStorage.removeItem('timeLeaderboard');
	leaderboard = {};
	teamLeaderboard = {};
	timeleaderboard = {};
	displayLeaderboard();
	displayTimeLeaderboard();
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// STYLING AND LISTENERS -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Podium Styling
function podiumStyling() {
	const podiumNum = document.querySelectorAll('.number');

	podiumNum.forEach((span) => {
		const number = parseInt(span.innerHTML, 10);
		const div = span.closest('.numberDiv');

		if (number == 1) {
			div.style.backgroundColor = '#FFD700';
		}

		if (number == 2) {
			div.style.backgroundColor = '#C0C0C0';
		}

		if (number == 3) {
			div.style.backgroundColor = '#CD7F32';
		}
	});
}

// Mobile
const windowSize = window.matchMedia('(max-width: 768px)');
const leaderboardCol = document.getElementById('leaderboardCol');
const navbar = document.querySelector('.navbar');

function mobileView() {
	if (windowSize.matches) {
		leaderboardCol.classList.add('flex-column');
		navbar.classList.remove('gap-3');
	} else {
		leaderboardCol.classList.remove('flex-column');
		navbar.classList.add('gap-3');
	}
}

document.addEventListener('DOMContentLoaded', () => {
	loadLeaderboard();
	mobileView();

	// Points System Select
	const select = document.getElementById('points-system-select');
	if (select) {
		selectedPointsSystem = select.value;

		select.addEventListener('change', (e) => {
			selectedPointsSystem = e.target.value;
		});
	}

	// Points Scorers Select
	const scorersSelect = document.getElementById('points-scorers-select');
	if (scorersSelect) {
		selectedTeamPointsSystem = scorersSelect.value;

		scorersSelect.addEventListener('change', (e) => {
			selectedTeamPointsSystem = e.target.value;
		});
	}

	// Load Results Button
	document
		.getElementById('load-results-btn')
		.addEventListener('click', loadResults);

	// Clear Points
	document.getElementById('clear-points-btn').addEventListener('click', () => {
		if (confirm('Are you sure you want to clear all points?')) {
			clearPoints();
		}
	});

	// Delete All Data
	document.getElementById('delete-all-btn').addEventListener('click', () => {
		if (confirm('Are you sure you want to delete all data?')) {
			clearLocalStorage();
		}
	});

	// Demo Results 1
	document
		.getElementById('load-demo-results-btn')
		.addEventListener('click', () => {
			multipleResults = {};
			pendingFiles.clear();

			pendingFiles.add('demo_results.csv');
			fetch('demoresults/demo_teams.csv')
				.then((r) => r.text())
				.then((csvText) => {
					const demoTeamFile = new File([csvText], 'demo_teams.csv', {
						type: 'text/csv',
					});
					processTeamCsv(demoTeamFile);
				});

			fetch('demoresults/demo_results.csv')
				.then((response) => response.text())
				.then((csvText) => {
					const demoFile = new File([csvText], 'demo_results.csv', {
						type: 'text/csv',
					});
					processCsv(demoFile);
				})
				.catch((error) => {
					console.error('Failed to load demo results:', error);
					alert('Could not load demo results. Please try again.');
				});
		});

	// Demo Results 2
	document
		.getElementById('load-demo-results-btn-2')
		.addEventListener('click', () => {
			multipleResults = {};
			pendingFiles.clear();

			pendingFiles.add('demo_results_2.csv');
			fetch('demoresults/demo_teams.csv')
				.then((r) => r.text())
				.then((csvText) => {
					const demoTeamFile = new File([csvText], 'demo_teams.csv', {
						type: 'text/csv',
					});
					processTeamCsv(demoTeamFile);
				});

			fetch('demoresults/demo_results_2.csv')
				.then((response) => response.text())
				.then((csvText) => {
					const demoFile = new File([csvText], 'demo_results_2.csv', {
						type: 'text/csv',
					});
					processCsv(demoFile);
				})
				.catch((error) => {
					console.error('Failed to load demo results:', error);
					alert('Could not load demo results. Please try again.');
				});
		});
});

// Run on window resize
window.addEventListener('resize', mobileView);

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
