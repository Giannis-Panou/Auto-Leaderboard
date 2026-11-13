import { toCsv } from './csv.js';

const COLORS = {
	bg: '#11121d',
	surface: '#202c43',
	text: '#ffffff',
	muted: '#8a93a8',
	accent: '#fb4c04',
	up: '#19b37d',
	down: '#ff4d4d',
	podium: ['#ffd700', '#c0c0c0', '#cd7f32'],
	chips: { CA1: '#ff8a3d', CA2: '#4da3ff', CA3: '#3ddc97', CA4: '#c08bff' },
};
const FONT = '"WRC Clean", system-ui, sans-serif';

const slug = (text) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

export const exportFileName = (title, ext) =>
	`${slug(title)}-${new Date().toISOString().slice(0, 10)}.${ext}`;

export function downloadBlob(blob, fileName) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(rows, fileName) {
	downloadBlob(new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' }), fileName);
}

export const canCopyImage = () =>
	typeof window !== 'undefined' && 'ClipboardItem' in window && !!navigator.clipboard?.write;

export async function copyImage(blob) {
	await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

// Rectangle with the app's cut corners (top-left and bottom-right rounded).
function cutRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w, y);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x, y + h);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function fitText(ctx, text, maxWidth) {
	if (ctx.measureText(text).width <= maxWidth) return text;
	let out = text;
	while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) out = out.slice(0, -1);
	return out + '…';
}

// Draw a standings table as a shareable PNG in the app's style.
// rows: [{ rank, name, sub, chip, value, delta }]
export async function renderStandingsImage({ title, subtitle, rows }) {
	await Promise.all([
		document.fonts?.load(`700 28px ${FONT}`),
		document.fonts?.load(`400 20px ${FONT}`),
	]);

	const scale = 2;
	const width = 1080;
	const pad = 48;
	const rowH = 60;
	const gap = 8;
	const headerH = 170;
	const footerH = 70;
	const height = headerH + rows.length * (rowH + gap) + footerH;
	// Reserve a column only if some row uses it
	const hasDelta = rows.some((r) => r.delta);
	const hasChip = rows.some((r) => r.chip);
	const hasSub = rows.some((r) => r.sub);

	const canvas = document.createElement('canvas');
	canvas.width = width * scale;
	canvas.height = height * scale;
	const ctx = canvas.getContext('2d');
	ctx.scale(scale, scale);

	ctx.fillStyle = COLORS.bg;
	ctx.fillRect(0, 0, width, height);

	// Brand mark + title
	ctx.save();
	ctx.translate(pad, 52);
	ctx.transform(1, 0, -0.21, 1, 0, 0);
	ctx.fillStyle = COLORS.accent;
	ctx.fillRect(8, 0, 12, 44);
	ctx.restore();
	ctx.fillStyle = COLORS.text;
	ctx.textBaseline = 'middle';
	ctx.font = `700 40px ${FONT}`;
	ctx.fillText(fitText(ctx, title.toUpperCase(), width - pad * 2 - 40), pad + 40, 76);
	ctx.fillStyle = COLORS.muted;
	ctx.font = `400 20px ${FONT}`;
	ctx.fillText(subtitle, pad + 40, 116);

	// Checkered strip
	const sq = 7;
	for (let x = pad; x < width - pad; x += sq) {
		for (let row = 0; row < 2; row++) {
			if ((Math.floor((x - pad) / sq) + row) % 2 === 0) {
				ctx.fillStyle = COLORS.text;
				ctx.globalAlpha = 0.85;
				ctx.fillRect(x, 140 + row * sq, sq, sq);
			}
		}
	}
	ctx.globalAlpha = 1;

	rows.forEach((row, i) => {
		const y = headerH + i * (rowH + gap);
		const x = pad;
		const w = width - pad * 2;

		ctx.fillStyle = COLORS.surface;
		cutRect(ctx, x, y, w, rowH, 10);
		ctx.fill();

		// Rank badge
		ctx.save();
		cutRect(ctx, x, y, w, rowH, 10);
		ctx.clip();
		ctx.fillStyle = typeof row.rank === 'number' && row.rank <= 3 ? COLORS.podium[row.rank - 1] : COLORS.text;
		ctx.fillRect(x, y, 60, rowH);
		ctx.restore();
		const mid = y + rowH / 2 + 1;
		ctx.fillStyle = COLORS.bg;
		ctx.font = `700 ${String(row.rank).length > 2 ? 20 : 24}px ${FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText(String(row.rank), x + 30, mid);

		// Fixed columns (right to left), the same on every row so they line up
		const valueRight = x + w - 20;
		const deltaRight = valueRight - (hasDelta ? 76 : 0);
		const chipLeft = deltaRight - (hasDelta ? 58 : 0) - (hasChip ? 64 : 0);
		const nameX = x + 80;
		const textRight = chipLeft - 20;
		const subX = nameX + (textRight - nameX) * 0.52;

		ctx.textAlign = 'right';
		ctx.fillStyle = COLORS.text;
		ctx.font = `700 26px ${FONT}`;
		ctx.fillText(String(row.value), valueRight, mid);

		if (row.delta) {
			ctx.font = `700 17px ${FONT}`;
			ctx.fillStyle = row.delta.startsWith('▲') ? COLORS.up : row.delta.startsWith('▼') ? COLORS.down : COLORS.muted;
			ctx.fillText(row.delta, deltaRight, mid);
		}
		ctx.textAlign = 'left';

		if (row.chip) {
			const color = COLORS.chips[row.chip] || COLORS.muted;
			ctx.font = `700 14px ${FONT}`;
			ctx.strokeStyle = color;
			ctx.fillStyle = color;
			ctx.lineWidth = 1.5;
			cutRect(ctx, chipLeft, y + rowH / 2 - 13, 52, 26, 4);
			ctx.stroke();
			ctx.textAlign = 'center';
			ctx.fillText(row.chip, chipLeft + 26, mid);
			ctx.textAlign = 'left';
		}

		ctx.fillStyle = COLORS.text;
		ctx.font = `700 25px ${FONT}`;
		ctx.fillText(fitText(ctx, row.name, (hasSub ? subX : textRight) - nameX - 16), nameX, mid);
		if (row.sub) {
			ctx.fillStyle = COLORS.muted;
			ctx.font = `400 19px ${FONT}`;
			ctx.fillText(fitText(ctx, row.sub, textRight - subX), subX, mid);
		}
	});

	ctx.fillStyle = COLORS.muted;
	ctx.font = `400 18px ${FONT}`;
	ctx.fillText(
		`Auto Leaderboard · ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
		pad,
		height - footerH / 2
	);

	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not render image'))), 'image/png')
	);
}
