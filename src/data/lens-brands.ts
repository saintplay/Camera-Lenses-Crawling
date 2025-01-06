import { AllowListItem, keyedListToSortedAllowlist } from "./data";

export const LENS_BRANDS = [
	'7artisans',
	"Artra Lab",
	"AstrHori",
	"Brightin Star",
	"Fujifilm",
	"IRIX",
	"KamLan",
	"Kipon",
	"Lensbaby",
	"Meike",
	"Mitakon",
	"Meyer-Optik Gorlitz",
	"NiSi",
	"Opteka",
	"Pergear",
	"Rokinon",
	"Samyang",
	"Sigma",
	"Sirui",
	"SLR Magic",
	"Tamron",
	"Tokina",
	"TTArtisan",
	"Venus Optics",
	"Viltrox",
	"Voigtlaender",
	"Zeiss",
	"Zenit",
] as const;

export type LensBrand = typeof LENS_BRANDS[number]

export const BRANDS_DATA: {
	[brand in LensBrand]: Omit<AllowListItem, 'name'> & {
		lines: { [line: string]: { priorityIndex?: number; } }
		priorityIndex?: number;
	}
} = {
	"7artisans": {
		lines: {},
	},
	"AstrHori": {
		lines: {},
	},
	"Artra Lab": {
		lines: {
			'Latalumen': {},
			'Nonikkor-MC': {},
		},
	},
	"Brightin Star": {
		lines: {},
		aliases: ['brightinstar']
	},
	"Fujifilm": {
		lines: {
			"XF": {},
			"XC": {},
			"MKX": {},
		},
		aliases: ['fuji', 'fujinon']
	},
	"IRIX": {
		lines: {
			'Firefly': {}
		},
	},
	"KamLan": {
		lines: {},
	},
	"Kipon": {
		lines: {
			"Iberit": {},
			"Ibelux": {}
		},
	},
	"Lensbaby": {
		lines: {
			"Edge": {},
			"Soft Focus": {},
			"Sol": {},
			"Sweet": {},
			"Trio": {},
			"Velvet": {},
		},
	},
	"Meike": {
		lines: {},
	},
	"Mitakon": {
		lines: {
			"Creator": {},
			"Speedmaster": {},
		},
		aliases: ["zy optics", "zy optics mitakon"]
	},
	"Meyer-Optik Gorlitz": {
		lines: {
			"Biotar": {},
			"Lydith": {},
			"Primoplan": {},
			"Trioplan": {},
		},
		aliases: ['meyer-optik görlitz', 'meyer optik görlitz', 'meyer-optik']
	},
	"NiSi": {
		lines: {
			"Sunstar": {},
		},
	},
	"Opteka": {
		lines: {},
	},
	"Pergear": {
		lines: {},
	},
	"Rokinon": {
		lines: {},
	},
	"Samyang": {
		lines: {},
	},
	"Sigma": {
		lines: {
			"Art": {},
			"Contemporary": {},
			"Sports": {},
		},
	},
	"Sirui": {
		lines: {
			"Sniper": {}
		},
	},
	"SLR Magic": {
		lines: {
			"CINE": {},
		},
		aliases: ['slrmagic']
	},
	"Tamron": {
		lines: {
			"Di III-A": { priorityIndex: 1 },
			"Di III": {},
		},
	},
	"Tokina": {
		lines: {
			"opera": {},
			"atx-i": {},
			"atx-m": {},
			"SZ": {},
			"SZ PRO": {},
		},
	},
	"TTArtisan": {
		lines: {},
	},
	"Venus Optics": {
		lines: {
			"Argus": {},
			"Zoom Shift": {},
			"Zero-D Shift": {},
		},
	},
	"Viltrox": {
		lines: {},
	},
	"Voigtlaender": {
		lines: {
			"Heliar": {},
			"Nokton": {},
			"Color-Skopar": {},
			"Ultron": {},
		},
		aliases: ['voigtlander', 'voigtländer']
	},
	"Zeiss": {
		lines: {
			"Biogon": {},
			"Distagon": {},
			"Milvus": {},
			"Otus": {},
			"Planar": {},
			"Touit": {},
		},
	},
	"Zenit": {
		lines: {
			"Zenitar": {},
		},
	},
}

export const LENS_BRANDS_ALLOWLIST = keyedListToSortedAllowlist<LensBrand>(BRANDS_DATA);