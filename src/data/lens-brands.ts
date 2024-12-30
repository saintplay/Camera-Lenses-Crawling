import { AllowListItem, keyedListToSortedAllowlist } from "./data";

export const LENS_BRANDS = [
	"Fujifilm",
	"Sigma",
	"Tokina",
] as const;

export type LensBrand = typeof LENS_BRANDS[number]

export const BRANDS_DATA: {
	[brand in LensBrand]: Omit<AllowListItem, 'name'> & {
		lines: { [line: string]: { priorityIndex?: number; } }
		priorityIndex?: number;
	}
} = {
	"Fujifilm": {
		lines: {},
		aliases: ['fuji']
	},
	"Tokina": {
		lines: {
			"atx-i": {}
		},
	},
	"Sigma": {
		lines: {
			"Art": {},
			"Contemporary": {},
			"Sports": {},
		},
	}
}

export const LENS_BRANDS_ALLOWLIST = keyedListToSortedAllowlist<LensBrand>(BRANDS_DATA);