const Svg = ({ children, size = 20 }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		{children}
	</svg>
);

export const UploadIcon = (props) => (
	<Svg {...props}>
		<path d="M12 15V4M7 9l5-5 5 5M5 20h14" />
	</Svg>
);

export const DotsIcon = (props) => (
	<Svg {...props}>
		<circle cx="5" cy="12" r="1.2" fill="currentColor" />
		<circle cx="12" cy="12" r="1.2" fill="currentColor" />
		<circle cx="19" cy="12" r="1.2" fill="currentColor" />
	</Svg>
);

export const SlidersIcon = (props) => (
	<Svg {...props}>
		<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
		<circle cx="15" cy="6" r="2" />
		<circle cx="9" cy="12" r="2" />
		<circle cx="17" cy="18" r="2" />
	</Svg>
);

export const FlagIcon = (props) => (
	<Svg {...props}>
		<path d="M5 21V4M5 4h12l-2.5 4L17 12H5" />
	</Svg>
);

export const GridIcon = (props) => (
	<Svg {...props}>
		<rect x="4" y="4" width="7" height="7" />
		<rect x="13" y="4" width="7" height="7" />
		<rect x="4" y="13" width="7" height="7" />
		<rect x="13" y="13" width="7" height="7" />
	</Svg>
);

export const TrophyIcon = (props) => (
	<Svg {...props}>
		<path d="M8 21h8M12 16v5M7 4h10v5a5 5 0 0 1-10 0V4zM17 6h3v1a4 4 0 0 1-3 4M7 6H4v1a4 4 0 0 0 3 4" />
	</Svg>
);
