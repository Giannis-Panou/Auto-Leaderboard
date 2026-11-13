import { useEffect, useRef, useState } from 'react';

// Icon button with a popover. `children` is a render function receiving close().
export default function Menu({ label, icon, children, className = '' }) {
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
		<div className={`menu ${className}`} ref={ref}>
			<button
				type="button"
				className="icon-btn"
				aria-label={label}
				title={label}
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
