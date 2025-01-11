// TODO: Implement Chrome extension cache storage
export class ChromeExtensionMemoizer {
	_prefix: string;

	constructor(prefix: string) {
		this._prefix = prefix;
	}

	async get(key: string): Promise<string | null> {
		const cachedItem = await chrome.storage.local.get([`${this._prefix}-${key}`])
		const value = cachedItem[`${this._prefix}-${key}`]

		if (typeof value === 'undefined') {
			return null
		}

		if (typeof value === 'string') return value;

		return String(value);
	}
	
	async set(key: string, result: string) {
		return chrome.storage.local.set({ [`${this._prefix}-${key}`]: result })
	}
}