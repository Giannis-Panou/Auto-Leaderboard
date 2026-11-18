import { EmptyState } from './Leaderboard';
import DriverProfile from './DriverProfile';
import TeamProfile from './TeamProfile';
import { goBack } from '../hooks/useHashRoute';
import { isRealTeam } from '../lib/season';

// Full-page driver or team profile (#/driver/<name>, #/team/<name>).
export default function ProfilePage({ route, season, teamsByUser, platformOf }) {
	const isDriver = route.page === 'driver';
	const exists = isDriver
		? route.name in season.standings.drivers
		: isRealTeam(route.name) && route.name in season.standings.teams;

	return (
		<main className="profile-page">
			<nav className="page-nav" aria-label="Breadcrumb">
				<button type="button" className="back-btn" onClick={goBack}>
					← Back
				</button>
				<span className="page-crumb">
					{isDriver ? 'Driver' : 'Team'} profile · <strong>{route.name}</strong>
				</span>
			</nav>

			{!exists ? (
				<section className="panel">
					<EmptyState
						title={`${isDriver ? 'Driver' : 'Team'} not found`}
						message="They aren't in the loaded rounds. Load the season's results, or go back to the standings."
					/>
				</section>
			) : isDriver ? (
				<DriverProfile
					key={route.name}
					username={route.name}
					season={season}
					teamsByUser={teamsByUser}
					platformOf={platformOf}
				/>
			) : (
				<TeamProfile key={route.name} team={route.name} season={season} teamsByUser={teamsByUser} platformOf={platformOf} />
			)}
		</main>
	);
}
