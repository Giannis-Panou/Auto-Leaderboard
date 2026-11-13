import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { hideSplash } from './splash';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>
);

// Wait a frame so the first render is on screen before the splash fades.
requestAnimationFrame(hideSplash);
