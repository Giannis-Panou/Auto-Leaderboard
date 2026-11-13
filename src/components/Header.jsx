import Menu from './Menu';
import { DotsIcon, SlidersIcon } from './Icons';
import { POINTS_SYSTEM_OPTIONS, TEAM_SCORER_OPTIONS } from '../lib/pointsSystems';
import { DNF_OPTIONS } from '../lib/season';

function SelectField({ label, value, options, onChange }) {
	return (
		<label className="field">
			<span className="field-label">{label}</span>
			<span className="select-wrap">
				<select value={value} onChange={(e) => onChange(e.target.value)}>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</span>
		</label>
	);
}

export function Settings({ settings, onChange }) {
	return (
		<div className="settings">
			<SelectField
				label="Points system"
				value={settings.pointsSystem}
				options={POINTS_SYSTEM_OPTIONS}
				onChange={(v) => onChange('pointsSystem', v)}
			/>
			<SelectField
				label="Team scorers"
				value={settings.teamScorers}
				options={TEAM_SCORER_OPTIONS}
				onChange={(v) => onChange('teamScorers', v)}
			/>
			<SelectField
				label="DNF cut-off"
				value={settings.dnfCutoff}
				options={DNF_OPTIONS}
				onChange={(v) => onChange('dnfCutoff', Number(v))}
			/>
		</div>
	);
}

export default function Header({ isMobile, settings, onRemoveAllRounds, onDeleteAll }) {
	return (
		<>
			<header className="site-header">
				<h1 className="brand">
					<span className="brand-mark" aria-hidden="true" />
					Auto Leaderboard
				</h1>
				<div className="header-actions">
					{!isMobile && settings}
					<Menu
						label={isMobile ? 'Settings' : 'More actions'}
						icon={isMobile ? <SlidersIcon /> : <DotsIcon />}
					>
						{(close) => (
							<>
								{isMobile && <div className="menu-section">{settings}</div>}
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
							</>
						)}
					</Menu>
				</div>
			</header>
			<div className="checker" aria-hidden="true" />
		</>
	);
}
