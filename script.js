const pointsSystem = [30, 24, 21, 19, 17, 15, 13, 11, 9, 7, 5, 4, 3, 2, 1];
const powerStagePoints = [5, 4, 3, 2, 1];
let leaderboard = {};
let teamLeaderboard = {};

// Process CSV
function processCsvResults(file) {
	const reader = new FileReader();

	reader.onload = function (event) {
		try {
			const csvResults = event.target.result;
			const jsonResults = csvToJson(csvResults);
			updateLeaderboard(jsonResults, file);
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
function csvToJson(csv) {
	const lines = csv.split('\n');
	const teamsFromStorage = JSON.parse(localStorage.getItem('teams'));

	const results = lines
		.slice(1)
		.map((line) => {
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

			return null;
		})
		.filter((result) => result !== null);

	return results;
}

// CSV to Team JSON
function csvToTeamJson(csv) {
	const lines = csv.split('\n');

	const teams = lines
		.slice(1)
		.map((line) => {
			const values = line.split(',');
			if (values.length >= 2) {
				return {
					username: values[1].trim(),
					team: values[2].trim(),
				};
			}
			return null;
		})
		.filter((result) => result !== null);
	return teams;
}

// Update leaderboard
function updateLeaderboard(playersResults, file) {
	const pointsArray = file.name.endsWith('_powerstage.csv')
		? powerStagePoints
		: pointsSystem;

	playersResults.forEach((player) => {
		const { username, place, team } = player;
		const points = pointsArray[place - 1] || 0;

		leaderboard[username] = (leaderboard[username] || 0) + points;

		if (team) {
			teamLeaderboard[team] = (teamLeaderboard[team] || 0) + points;
		}
	});

	saveLeaderboard();
	displayLeaderboard();
	displayTeamLeaderboard();
}

// Display leaderboard
function displayLeaderboard() {
	const sortedLeaderboard = Object.entries(leaderboard).sort(
		(a, b) => b[1] - a[1]
	);

	const resultsContainer = document.querySelector('.results-container');
	resultsContainer.innerHTML = '';

	if (sortedLeaderboard.length > 0) {
		const leaderboardHtml = sortedLeaderboard
			.map(
				([username, points], index) =>
					`<div class="leaderboard-entry">${
						index + 1
					}. ${username}: ${points} points</div>`
			)
			.join('');

		resultsContainer.innerHTML = `<h2>Leaderboard</h2>${leaderboardHtml}`;
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
					`<div class="leaderboard-entry">${
						index + 1
					}. ${team}: ${points} points</div>`
			)
			.join('');

		resultsContainer.innerHTML = `<h2>Team Leaderboard</h2>${leaderboardHtml}`;
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
		displayLeaderboard();
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

// Export leaderboard
function exportResults() {
	const dataStr = JSON.stringify(leaderboard, null, 2);
	const blob = new Blob([dataStr], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'leaderboard.json';
	a.click(); // Trigger download
	URL.revokeObjectURL(url);
}

// Load Results
function handleLoadResults() {
	const csvFileInput = document.getElementById('csv-file');
	const file = csvFileInput.files[0];

	if (file) {
		if (file.name.endsWith('.csv')) {
			processTeamCsv(file);
			processCsvResults(file);
		} else {
			alert('Please upload a CSV file.');
		}

		csvFileInput.value = '';
	} else {
		alert('Please select a file.');
	}
}

window.addEventListener('DOMContentLoaded', () => {
	loadLeaderboard();
	loadTeamLeaderboard();

	document
		.getElementById('load-results-btn')
		.addEventListener('click', handleLoadResults);

	document
		.getElementById('clear-points-btn')
		.addEventListener('click', clearPoints);

	document
		.getElementById('clear-points-btn')
		.addEventListener('click', clearTeamPoints);

	document
		.getElementById('export-results-btn')
		.addEventListener('click', exportResults);

	document
		.getElementById('delete-all-btn')
		.addEventListener('click', clearLocalStorage);
});
