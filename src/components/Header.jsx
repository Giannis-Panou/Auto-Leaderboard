import { useEffect, useRef, useState } from 'react';
import { DotsIcon, SlidersIcon } from './Icons';
import { POINTS_SYSTEM_OPTIONS, TEAM_SCORER_OPTIONS } from '../lib/pointsSystems';

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

export function Settings({ pointsSystem, onPointsSystemChange, teamScorers, onTeamScorersChange }) {
	return (
		<div className="settings">
			<SelectField
				label="Points system"
				value={pointsSystem}
				options={POINTS_SYSTEM_OPTIONS}
				onChange={onPointsSystemChange}
			/>
			<SelectField
				label="Team scorers"
				value={teamScorers}
				options={TEAM_SCORER_OPTIONS}
				onChange={onTeamScorersChange}
			/>
		</div>
	);
}

function Menu({ label, icon, children }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (e) => {
			if (!ref.current?.contains(e.target)) setOpen(false);
		};
		const onKeyDown = (e) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open]);

	return (
		<div className="menu" ref={ref}>
			<button
				type="button"
				className="icon-btn"
				aria-label={label}
				aria-haspopup="true"
				aria-expanded={open}
				onClick={() => setOpen((o) => !o)}
			>
				{icon}
			</button>
			{open && <div className="menu-pop">{children(() => setOpen(false))}</div>}
		</div>
	);
}

export default function Header({ isMobile, settings, onClearPoints, onDeleteAll }) {
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
											onClearPoints();
										}}
									>
										<span>Clear points</span>
									</button>
									<button
										type="button"
										className="btn btn-danger-outline"
										onClick={() => {
											close();
											onDeleteAll();
										}}
									>
										<span>Delete leaderboards</span>
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
