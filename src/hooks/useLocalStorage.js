import { useEffect, useState } from 'react';

// useState that is persisted to localStorage under `key`.
export function useLocalStorage(key, initialValue, validate = () => true) {
	const [value, setValue] = useState(() => {
		try {
			const saved = localStorage.getItem(key);
			if (saved === null) return initialValue;
			const parsed = JSON.parse(saved);
			return validate(parsed) ? parsed : initialValue;
		} catch {
			return initialValue;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			// Storage unavailable (private mode, quota) — keep in-memory state.
		}
	}, [key, value]);

	return [value, setValue];
}
