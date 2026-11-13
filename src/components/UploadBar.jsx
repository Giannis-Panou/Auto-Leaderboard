import { useRef, useState } from 'react';
import { UploadIcon } from './Icons';

const ACCEPTED = /\.csv$/i;

export default function UploadBar({ onUpload, demos, onLoadDemo }) {
	const inputRef = useRef(null);
	const [files, setFiles] = useState([]);
	const [dragging, setDragging] = useState(false);
	const [roundName, setRoundName] = useState('');

	const pickFiles = (list) => setFiles(Array.from(list).filter((f) => ACCEPTED.test(f.name)));

	const submit = () => {
		onUpload(files, roundName);
		setFiles([]);
		setRoundName('');
		if (inputRef.current) inputRef.current.value = '';
	};

	const dropzoneClass = [
		'dropzone',
		dragging && 'is-dragging',
		files.length > 0 && 'has-files',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<section className="upload" aria-label="Load results">
			<label
				className={dropzoneClass}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					pickFiles(e.dataTransfer.files);
				}}
			>
				<input
					ref={inputRef}
					type="file"
					accept=".csv"
					multiple
					className="visually-hidden"
					onChange={(e) => pickFiles(e.target.files)}
				/>
				<UploadIcon size={22} />
				<span className="dropzone-text">
					{files.length > 0 ? (
						<>
							<strong>
								{files.length} file{files.length > 1 ? 's' : ''}
							</strong>{' '}
							{files.map((f) => f.name).join(', ')}
						</>
					) : (
						<>
							Drop results CSVs here or <u>browse</u>
						</>
					)}
				</span>
			</label>

			<label className="field round-name-field">
				<span className="field-label">Round name</span>
				<input
					type="text"
					className="text-input"
					placeholder="e.g. Round 3 · Kenya"
					value={roundName}
					onChange={(e) => setRoundName(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && files.length > 0 && submit()}
				/>
			</label>

			<button
				type="button"
				className="btn btn-accent"
				onClick={submit}
				disabled={files.length === 0}
			>
				<span>Submit</span>
			</button>

			<div className="demo-links">
				<span>Try a demo</span>
				{demos.map((demo) => (
					<button
						key={demo.folder}
						type="button"
						className="link-btn"
						onClick={() => onLoadDemo(demo)}
					>
						{demo.label}
					</button>
				))}
			</div>
		</section>
	);
}
