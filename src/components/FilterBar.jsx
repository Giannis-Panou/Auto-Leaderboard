import Tabs from './Tabs';
import { SearchIcon } from './Icons';
import { PLATFORMS } from '../lib/platform';

const PLATFORM_TABS = [{ value: 'ALL', label: 'All' }, ...PLATFORMS.map((p) => ({ value: p.value, label: p.label }))];

// View switch, search and platform filter (they apply to every board).
// The "last round" status now lives in the header's timing blocks.
export default function FilterBar({ views, view, onViewChange, search, onSearch, platform, onPlatform }) {
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
		</section>
	);
}
