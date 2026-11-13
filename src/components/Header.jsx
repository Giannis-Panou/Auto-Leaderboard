import Menu from './Menu';
import { DotsIcon } from './Icons';

// Slim header: brand + a menu with the destructive actions.
export default function Header({ onRemoveAllRounds, onDeleteAll }) {
	return (
		<>
			<header className="site-header">
				<h1 className="brand">
					<span className="brand-mark" aria-hidden="true" />
					Auto Leaderboard
				</h1>
				<Menu label="More actions" icon={<DotsIcon />}>
					{(close) => (
						<div className="menu-section">
							<span className="field-label">Danger zone</span>
							<button
								type="button"
								className="btn btn-danger-outline"
								onClick={() => {
									close();
									onRemoveAllRounds();
								}}
							>
								<span>Remove all rounds</span>
							</button>
							<button
								type="button"
								className="btn btn-danger-outline"
								onClick={() => {
									close();
									onDeleteAll();
								}}
							>
								<span>Delete all data</span>
							</button>
						</div>
					)}
				</Menu>
			</header>
			<div className="checker" aria-hidden="true" />
		</>
	);
}
