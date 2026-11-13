import { useRef, useState } from 'react';
import { UploadIcon } from './Icons';
import { POINTS_SYSTEM_OPTIONS, TEAM_SCORER_OPTIONS } from '../lib/pointsSystems';
import { DNF_OPTIONS } from '../lib/season';

const ACCEPTED = /\.csv$/i;

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

function Step({ number, title, className = '', children }) {
	return (
		<div className={`load-step ${className}`}>
			<h2 className="step-title">
				<span className="step-number">{number}</span>
				{title}
			</h2>
			{children}
		</div>
	);
}

// "Load a round": scoring rules -> results files -> name & submit, in one
// panel so it's clear the rules are what the uploaded results are scored with.
export default function LoadPanel({ settings, onSettingChange, onUpload, demos, onLoadDemo }) {
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

	const dropzoneClass = ['dropzone', dragging && 'is-dragging', files.length > 0 && 'has-files']
		.filter(Boolean)
		.join(' ');

	return (
		<section className="load-panel" aria-label="Load a round">
			<div className="load-steps">
				<Step number="1" title="Scoring rules" className="step-rules">
					<div className="rules-fields">
						<SelectField
							label="Points system"
							value={settings.pointsSystem}
							options={POINTS_SYSTEM_OPTIONS}
							onChange={(v) => onSettingChange('pointsSystem', v)}
						/>
						<SelectField
							label="Team scorers"
							value={settings.teamScorers}
							options={TEAM_SCORER_OPTIONS}
							onChange={(v) => onSettingChange('teamScorers', v)}
						/>
						<SelectField
							label="DNF cut-off"
							value={settings.dnfCutoff}
							options={DNF_OPTIONS}
							onChange={(v) => onSettingChange('dnfCutoff', Number(v))}
						/>
					</div>
				</Step>

				<Step number="2" title="Results files" className="step-files">
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
					<p className="dropzone-hint">Add teams.csv with them to set teams, categories and nationalities.</p>
				</Step>

				<Step number="3" title="Name & submit" className="step-submit">
					<div className="submit-row">
						<label className="field">
							<span className="visually-hidden">Round name</span>
							<input
								type="text"
								className="text-input"
								placeholder="Round name (optional)"
								value={roundName}
								onChange={(e) => setRoundName(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && files.length > 0 && submit()}
							/>
						</label>
						<button type="button" className="btn btn-accent" onClick={submit} disabled={files.length === 0}>
							<span>Submit</span>
						</button>
					</div>
				</Step>
			</div>

			<div className="load-footer">
				<p className="load-note">
					Scoring rules apply to <strong>every round</strong> — changing them re-scores the whole season.
				</p>
				<div className="demo-links">
					<span>Try a demo</span>
					{demos.map((demo) => (
						<button key={demo.folder} type="button" className="link-btn" onClick={() => onLoadDemo(demo)}>
							{demo.label}
						</button>
					))}
				</div>
			</div>
		</section>
	);
}
