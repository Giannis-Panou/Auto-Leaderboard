const pointsSystem = [30, 24, 21, 19, 17, 15, 13, 11, 9, 7, 5, 4, 3, 2, 1];
const powerStagePoints = [5, 4, 3, 2, 1];
let leaderboard = {};

// // Parse JSON
// function parseJsonResults(file) {
// 	const reader = new FileReader();

// 	reader.onload = function (event) {
// 		try {
// 			const results = JSON.parse(event.target.result);
// 			updateLeaderboard(results); // Update leaderboard with the parsed data
// 		} catch (error) {
// 			console.error('Error parsing JSON:', error);
// 			alert('Error parsing JSON file. Please check the file format.');
// 		}
// 	};

// 	reader.readAsText(file); // Read the file content as text
// }

// Parse CSV
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

// CSV to JSON
function csvToJson(csv) {
	const lines = csv.split('\n');

	const results = lines
		.slice(1)
		.map((line) => {
			const values = line.split(',');

			if (values.length >= 2) {
				return {
					username: values[1].trim(),
					place: parseInt(values[0].trim(), 10),
				};
			}

			return null;
		})
		.filter((result) => result !== null);

	return results;
}

// Update leaderboard
function updateLeaderboard(playersResults, file) {
	if (file.name.endsWith('_powerstage.csv')) {
		playersResults.forEach((player) => {
			const { username, place } = player;
			const points = powerStagePoints[place - 1] || 0;
			leaderboard[username] = (leaderboard[username] || 0) + points;
		});
	} else {
		playersResults.forEach((player) => {
			const { username, place } = player;
			const points = pointsSystem[place - 1] || 0;
			leaderboard[username] = (leaderboard[username] || 0) + points;
		});
	}
	saveLeaderboard();
	displayLeaderboard();
}

// Display leaderboard
function displayLeaderboard() {
	const sortedLeaderboard = Object.entries(leaderboard).sort(
		(a, b) => b[1] - a[1]
	);

	const resultsContainer = document.querySelector('.results-container');
	resultsContainer.innerHTML = '';

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

// Save leaderboard to localStorage
function saveLeaderboard() {
	localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Load leaderboard from localStorage
function loadLeaderboard() {
	const savedLeaderboard = localStorage.getItem('leaderboard');
	if (savedLeaderboard) {
		leaderboard = JSON.parse(savedLeaderboard);
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

	document
		.getElementById('load-results-btn')
		.addEventListener('click', handleLoadResults);

	document
		.getElementById('clear-points-btn')
		.addEventListener('click', clearPoints);

	document
		.getElementById('export-results-btn')
		.addEventListener('click', exportResults);
});
