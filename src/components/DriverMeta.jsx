import { flagCode } from '../lib/countries';
import worldFlag from '../assets/flag-world.svg';

// Flag SVGs from flag-icons; only the ones on screen are ever downloaded.
const FLAG_URLS = import.meta.glob('/node_modules/flag-icons/flags/4x3/*.svg', {
	eager: true,
	query: '?url',
	import: 'default',
});

// Drivers with no nationality (blank, or not in the teams file) get a
// "rest of the world" flag. Unrecognised codes are shown as text.
export function Flag({ nat }) {
	if (!nat?.trim()) {
		return (
			<img
				className="flag"
				src={worldFlag}
				alt="Rest of the world"
				title="Rest of the world"
				width="20"
				height="15"
				loading="lazy"
			/>
		);
	}
	const code = flagCode(nat);
	const src = code && FLAG_URLS[`/node_modules/flag-icons/flags/4x3/${code}.svg`];
	if (!src) return <span className="flag-code">{nat}</span>;
	return <img className="flag" src={src} alt={nat} title={nat} width="20" height="15" loading="lazy" />;
}

const PLATFORM_LABELS = {
	PC: { short: 'PC', full: 'PC' },
	PS: { short: 'PS', full: 'PlayStation' },
	XBOX: { short: 'XB', full: 'Xbox' },
};

export function PlatformBadge({ platform }) {
	const label = PLATFORM_LABELS[platform];
	if (!label) return null;
	return (
		<span className={`platform platform-${platform.toLowerCase()}`} title={label.full} aria-label={label.full}>
			{label.short}
		</span>
	);
}
