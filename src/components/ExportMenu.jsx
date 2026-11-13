import Menu from './Menu';
import { DownloadIcon } from './Icons';
import {
	canCopyImage,
	copyImage,
	downloadBlob,
	downloadCsv,
	exportFileName,
	renderStandingsImage,
} from '../lib/exporters';

// Export the current view as a PNG (download or copy, for Discord etc.) or CSV.
// getImage() -> { title, subtitle, rows }, getCsv() -> array of row arrays.
export default function ExportMenu({ title, getImage, getCsv, notify }) {
	const run = async (close, action) => {
		close();
		try {
			await action();
		} catch (error) {
			console.error(error);
			notify('Export failed — please try again.', 'error');
		}
	};

	return (
		<Menu label={`Export ${title}`} icon={<DownloadIcon />} className="export-menu">
			{(close) => (
				<div className="menu-section">
					<span className="field-label">Export</span>
					{getImage && (
						<button
							type="button"
							className="menu-item"
							onClick={() =>
								run(close, async () => {
									downloadBlob(await renderStandingsImage(getImage()), exportFileName(title, 'png'));
									notify('Image downloaded.', 'success');
								})
							}
						>
							Download image
						</button>
					)}
					{getImage && canCopyImage() && (
						<button
							type="button"
							className="menu-item"
							onClick={() =>
								run(close, async () => {
									await copyImage(await renderStandingsImage(getImage()));
									notify('Image copied — paste it into Discord or a post.', 'success');
								})
							}
						>
							Copy image
						</button>
					)}
					{getCsv && (
						<button
							type="button"
							className="menu-item"
							onClick={() =>
								run(close, () => {
									downloadCsv(getCsv(), exportFileName(title, 'csv'));
									notify('CSV downloaded.', 'success');
								})
							}
						>
							Download CSV
						</button>
					)}
				</div>
			)}
		</Menu>
	);
}
