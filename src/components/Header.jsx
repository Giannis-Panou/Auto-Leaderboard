import { useEffect, useRef, useState } from 'react';
import { formatDateTime } from '../lib/format';

// Wordmark: slanted white "door plate" with the É picked out in orange.
function Wordmark({ small = false }) {
	return (
		<span className={`brand${small ? ' brand-small' : ''}`}>
			<span className="brand-mark" aria-hidden="true" />
			<span className="brand-plate">
				<span className="brand-text">
					Parc Ferm<span className="brand-accent">é</span>
				</span>
			</span>
		</span>
	);
}

// Faint winding rally stage behind the header, start and finish marked.
function StageMap() {
	return (
		<svg className="stage-map" viewBox="0 0 600 120" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
			<path
				className="stage-road"
				d="M8 92 C 60 92, 70 30, 128 34 S 190 104, 250 88 S 300 18, 352 26 S 420 96, 470 80 S 540 22, 592 30"
			/>
			<circle className="stage-point" cx="8" cy="92" r="5" />
			<circle className="stage-point" cx="592" cy="30" r="5" />
		</svg>
	);
}

function TimingBlock({ label, children, className = '' }) {
	return (
		<div className={`timing-block ${className}`}>
			<span className="timing-label">{label}</span>
			<span className="timing-value">{children}</span>
		</div>
	);
}

// Header as a timing screen: name + tagline and the season's live state.
// A slim copy pins to the top of the page once you scroll past it.
export default function Header({ status }) {
	const headerRef = useRef(null);
	const [pinned, setPinned] = useState(false);

	useEffect(() => {
		const header = headerRef.current;
		if (!header || !('IntersectionObserver' in window)) return;
		const observer = new IntersectionObserver(([entry]) => setPinned(!entry.isIntersecting), { threshold: 0 });
		observer.observe(header);
		return () => observer.disconnect();
	}, []);

	const { round, leader, rounds, drivers, teams } = status;

	return (
		<>
			<header className="site-header" ref={headerRef}>
				<div className="header-bg" aria-hidden="true">
					<StageMap />
				</div>

				<div className="brand-block">
					<h1>
						<Wordmark />
					</h1>
					<p className="tagline">Sim rally championship</p>
				</div>

				<div className="timing" aria-label="Season status">
					{round ? (
						<>
							<TimingBlock label="Latest round" className="timing-round">
								{round.name}
							</TimingBlock>
							{leader && (
								<TimingBlock label="Leader" className="timing-leader">
									<span className="p1-chip">P1</span>
									<span className="leader-name">{leader.name}</span>
									<strong>{leader.points}</strong>
								</TimingBlock>
							)}
							<TimingBlock label="Season" className="timing-meta">
								{/* keyed on the round so the live dot pulses again when one loads */}
								<span className="live-dot" key={round.id} aria-hidden="true" />
								{rounds} round{rounds === 1 ? '' : 's'} · {drivers} drivers · {teams} teams
								<span className="timing-updated">Updated {formatDateTime(round.loadedAt)}</span>
							</TimingBlock>
						</>
					) : (
						<div className="timing-empty">
							<span className="live-dot is-idle" aria-hidden="true" />
							No rounds yet · load one below or try a demo
						</div>
					)}
				</div>

			</header>

			<div className="race-stripe" aria-hidden="true">
				<span className="stripe-orange" />
				<span className="stripe-white" />
				<span className="checker" />
			</div>

			{/* Slim header pinned while scrolling (desktop). Hidden from assistive tech: it repeats the header. */}
			<div className={`compact-bar${pinned ? ' is-visible' : ''}`} aria-hidden="true" inert={pinned ? undefined : ''}>
				<button type="button" className="compact-home" tabIndex={-1} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
					<Wordmark small />
				</button>
				{round && (
					<span className="compact-status">
						<span className="compact-round">{round.name}</span>
						{leader && (
							<>
								<span className="p1-chip">P1</span>
								{leader.name} <strong>{leader.points}</strong>
							</>
						)}
					</span>
				)}
				<button type="button" className="compact-top" tabIndex={-1} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
					Back to top ↑
				</button>
			</div>
		</>
	);
}
