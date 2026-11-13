import Tabs from './Tabs';
import { SearchIcon } from './Icons';
import { formatDateTime } from '../lib/format';
import { PLATFORMS } from '../lib/platform';

const PLATFORM_TABS = [{ value: 'ALL', label: 'All' }, ...PLATFORMS.map((p) => ({ value: p.value, label: p.label }))];

// Search + platform filter (applies to every board) and a "last updated" line.
export default function FilterBar({ views, view, onViewChange, search, onSearch, platform, onPlatform, lastRound, roundCount }) {
	return (
		<section className="filter-bar" aria-label="Filters">
			{views && <Tabs items={views} value={view} onChange={onViewChange} label="View" className="view-tabs" />}

			<label className="search">
				<SearchIcon size={18} />
				<span className="visually-hidden">Search drivers or teams</span>
				<input
					type="search"
					placeholder="Search drivers or teams"
					value={search}
					onChange={(e) => onSearch(e.target.value)}
				/>
			</label>

			<Tabs items={PLATFORM_TABS} value={platform} onChange={onPlatform} label="Platform" className="segmented" />

			<p className="status">
				{lastRound ? (
					<>
						Last round <strong>{lastRound.name}</strong> · loaded {formatDateTime(lastRound.loadedAt)} ·{' '}
						{roundCount} round{roundCount === 1 ? '' : 's'}
					</>
				) : (
					'No rounds loaded yet'
				)}
			</p>
		</section>
	);
}
