import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';

// ---- Toasts --------------------------------------------------------------

export function useToasts() {
	const [toasts, setToasts] = useState([]);
	const nextId = useRef(0);

	const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

	const notify = useCallback(
		(message, tone = 'info') => {
			const id = ++nextId.current;
			setToasts((list) => [...list.slice(-3), { id, message, tone }]);
			setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 5000);
		},
		[dismiss]
	);

	return { toasts, notify, dismiss };
}

export function Toasts({ toasts, onDismiss }) {
	return (
		<div className="toasts" aria-live="polite">
			{toasts.map((t) => (
				<div key={t.id} className={`toast toast-${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
					<span>{t.message}</span>
					<button type="button" className="toast-close" aria-label="Dismiss" onClick={() => onDismiss(t.id)}>
						<CloseIcon size={16} />
					</button>
				</div>
			))}
		</div>
	);
}

// ---- Confirm dialog ------------------------------------------------------

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', tone = 'danger', onClose }) {
	const confirmRef = useRef(null);

	useEffect(() => {
		confirmRef.current?.focus();
		const onKeyDown = (e) => {
			if (e.key === 'Escape') onClose(false);
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [onClose]);

	return (
		<div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose(false)}>
			<div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
				<h2 id="confirm-title">{title}</h2>
				<p id="confirm-message">{message}</p>
				<div className="modal-actions">
					<button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>
						<span>Cancel</span>
					</button>
					<button
						ref={confirmRef}
						type="button"
						className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-accent'}`}
						onClick={() => onClose(true)}
					>
						<span>{confirmLabel}</span>
					</button>
				</div>
			</div>
		</div>
	);
}

// const [confirm, dialog] = useConfirm(); if (await confirm({...})) { ... }
export function useConfirm() {
	const [request, setRequest] = useState(null);

	const confirm = useCallback((options) => new Promise((resolve) => setRequest({ ...options, resolve })), []);

	const close = useCallback(
		(result) => {
			request?.resolve(result);
			setRequest(null);
		},
		[request]
	);

	return [confirm, request && <ConfirmDialog {...request} onClose={close} />];
}
