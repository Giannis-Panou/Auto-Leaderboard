const pointsSystem = [10, 8, 6, 4, 2];
let leaderboard = {};

// Parse JSON
function parseResults(file) {
	const reader = new FileReader();

	reader.onload = function (event) {
		try {
			const results = JSON.parse(event.target.result);
			updateLeaderboard(results);
		} catch (error) {
			console.error('Error parsing JSON:', error);
			alert('Error parsing JSON file. Please check the file format.');
		}
	};

	reader.readAsText(file);
}

// Update leaderboard
function updateLeaderboard(playersResults) {
	playersResults.forEach((player) => {
		const { DisplayName, Rank } = player;
		const points = pointsSystem[Rank - 1] || 0;
		leaderboard[DisplayName] = (leaderboard[DisplayName] || 0) + points;
	});
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
	const jsonFileInput = document.getElementById('json-file');
	const file = jsonFileInput.files[0];

	if (file) {
		parseResults(file);
		jsonFileInput.value = '';
	} else {
		alert('Please select a JSON file!');
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
