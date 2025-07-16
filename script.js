// Points System
const pointsSystem = {
	WRC: [25, 17, 15, 12, 10, 8, 6, 4, 2, 1],
	Powerstage: [5, 4, 3, 2, 1],
	Rallycross: [20, 16, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
	F1: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
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

// Process CSV
function processCsvResults(file) {
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
				};
			});

			updateLeaderboard(combinedResults);
		} catch (error) {
			console.error('Error processing CSV:', error);
			alert('Error processing CSV file. Please check the file format.');
		}
	};

	reader.readAsText(file);
}

// Process Team CSV
function processTeamCsv(file) {
	const reader = new FileReader();

	reader.onload = function (event) {
		try {
			const csvResults = event.target.result;
			const teams = csvToTeamJson(csvResults);
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
	// const teamsFromStorage = JSON.parse(localStorage.getItem('teams')) || [];

	const results = lines.slice(1).flatMap((line) => {
		const values = line.split(',');

		if (values.length >= 2) {
			const username = values[1].trim();
			const place = parseInt(values[0].trim(), 10);

			const teamEntry = teamsFromStorage.find(
				(team) => team.username === username
			);
			const teamName = teamEntry ? teamEntry.team : null;

			return {
				username,
				place,
				team: teamName,
			};
		}

		return [];
	});

	return results;
}

// CSV to Team JSON
function csvToTeamJson(csv) {
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

// Update leaderboard
function updateLeaderboard(playersResults) {
	const pointsArray = pointsSystem[selectedPointsSystem] || pointsSystem.WRC;
	const teamContr = teamPointsSystem[selectedTeamPointsSystem] || 2;

	const teamScores = {};

	playersResults.forEach((player) => {
		const { username, place, team } = player;
		const points = pointsArray[place - 1] || 0;

		leaderboard[username] = (leaderboard[username] || 0) + points;

		if (team) {
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
	displayTeamLeaderboard();
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
							<div class="number">
								<span id="number">${index + 1}</span>
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
}

// Display Team leaderboard
function displayTeamLeaderboard() {
	const sortedLeaderboard = Object.entries(teamLeaderboard).sort(
		(a, b) => b[1] - a[1]
	);

	const resultsContainer = document.querySelector('.team-results-container');
	resultsContainer.innerHTML = '';

	if (sortedLeaderboard.length > 0) {
		const leaderboardHtml = sortedLeaderboard
			.map(
				([team, points], index) =>
					`<div class="leaderboard-entry list-group-item d-flex justify-content-between">
						<div class="number">
							<span id="number">${index + 1}</span>
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

		resultsContainer.innerHTML = `${leaderboardHtml}`;
	}
}

// Save leaderboard to localStorage
function saveLeaderboard() {
	localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
	localStorage.setItem('teamLeaderboard', JSON.stringify(teamLeaderboard));
}

// Load leaderboard from localStorage
function loadLeaderboard() {
	const savedLeaderboard = localStorage.getItem('leaderboard');
	if (savedLeaderboard) {
		leaderboard = JSON.parse(savedLeaderboard);
		displayLeaderboard();
	}
}

// Load Team leaderboard from localStorage
function loadTeamLeaderboard() {
	const savedLeaderboard = localStorage.getItem('teamLeaderboard');
	if (savedLeaderboard) {
		teamLeaderboard = JSON.parse(savedLeaderboard);
		displayTeamLeaderboard();
	}
}

// Clear points but keep player names
function clearPoints() {
	Object.keys(leaderboard).forEach((username) => {
		leaderboard[username] = 0; // Set points to 0 but keep names
	});
	saveLeaderboard(); // Save the cleared leaderboard to localStorage
	displayLeaderboard(); // Update the displayed leaderboard
}

// Clear team points but keep team names
function clearTeamPoints() {
	Object.keys(teamLeaderboard).forEach((team) => {
		teamLeaderboard[team] = 0; // Set points to 0 but keep names
	});
	saveLeaderboard(); // Save the cleared leaderboard to localStorage
	displayTeamLeaderboard(); // Update the displayed leaderboard
}

// Clear LocalStorage
function clearLocalStorage() {
	localStorage.removeItem('leaderboard');
	localStorage.removeItem('teamLeaderboard');
	leaderboard = {};
	teamLeaderboard = {};
	displayLeaderboard();
	displayTeamLeaderboard();
}

// Load Results
function handleLoadResults() {
	const csvFileInput = document.getElementById('csv-file');
	const file = csvFileInput.files[0];

	if (file) {
		if (file.name.endsWith('.csv')) {
			if (file.name.includes('_teams.csv')) {
				processTeamCsv(file);
				alert('Teams loaded successfully.');
			} else {
				processCsvResults(file);
			}
		} else {
			alert('Please upload a CSV file.');
		}

		csvFileInput.value = '';
	} else {
		alert('Please select a file.');
	}
}

// Mobile
var windowSize = window.matchMedia('(max-width: 768px)');
var pointsSystemSelect = document.getElementById('points-system-select');
var csvFileInput = document.getElementById('csv-file');
var navbar = document.getElementById('navbarDiv');
var demoNavbar = document.getElementById('demo-navbar-list');
var clearBtn = document.getElementById('clear-points-btn');
var leaderboardCol = document.getElementById('leaderboardCol');

function mobileView() {
	if (windowSize.matches) {
		leaderboardCol.classList.add('flex-column');
	} else {
		leaderboardCol.classList.remove('flex-column');
	}
}

document.addEventListener('DOMContentLoaded', () => {
	loadLeaderboard();
	loadTeamLeaderboard();

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
		.addEventListener('click', handleLoadResults);

	// Clear Points
	document.getElementById('clear-points-btn').addEventListener('click', () => {
		if (confirm('Are you sure you want to clear all points?')) {
			clearPoints();
			clearTeamPoints();
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
					const demoFile = new File([csvText], 'demoresults.csv', {
						type: 'text/csv',
					});
					processCsvResults(demoFile);
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
					const demoFile = new File([csvText], 'demoresults.csv', {
						type: 'text/csv',
					});
					processCsvResults(demoFile);
				})
				.catch((error) => {
					console.error('Failed to load demo results:', error);
					alert('Could not load demo results. Please try again.');
				});
		});
});

// Run on page load
document.addEventListener('DOMContentLoaded', mobileView);

// Run on window resize
window.addEventListener('resize', mobileView);
