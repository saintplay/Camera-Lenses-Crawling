import { AllowListItem, keyedListToSortedAllowlist } from "./data";

export const SENSOR_COVERAGES = [
	"APS-C",
	"Super35",
	"Full-Frame"
] as const;

export type SensorCoverage = typeof SENSOR_COVERAGES[number];

export const SENSOR_COVERAGE_DATA: {
	[sc in SensorCoverage]: Omit<AllowListItem, 'name'> & {
		priorityIndex?: number;
	}
} = {
	"APS-C": {
		aliases: ['apsc'],
	},
	"Super35": {
		aliases: ['s35', 'super-35'],
		priorityIndex: 1
	},
	"Full-Frame": {}
}

export const SENSOR_COVERAGE_ALLOWLIST = keyedListToSortedAllowlist<SensorCoverage>(SENSOR_COVERAGE_DATA);

export const LENS_MOUNTS = [
	"M42",
	"M39",
	"PL",
	"EF",
	"F",
	"K",
	"M",
	"E",
	"X",
	"L",
	"Z",
	"EF-M",
	"RF",
	"MFT",
	"T",
	"CX",
] as const;

export type LensMount = typeof LENS_MOUNTS[number];

export const LENS_MOUNT_DATA: {
	[lm in LensMount]: Omit<AllowListItem, 'name'> & {
		technologies: ('SLR' | 'mirrorless')[];
		priorityIndex?: number;
	}
} = {
	"M42": { technologies: ['SLR'] },
	"M39": { technologies: ['SLR'] },
	"PL": { technologies: ['SLR'] },
	"EF": { technologies: ['SLR'], aliases: ['ef-s'] },
	"F": { technologies: ['SLR'] },
	"K": { technologies: ['SLR'] },
	"M": { technologies: ['SLR'], aliases: ['vm', 'leica m'] },
	"E": { technologies: ['mirrorless'], aliases: ['fe', 'nex', 'nex-e'] },
	"X": { technologies: ['mirrorless'], aliases: ["fujifilm x", 'fx'] },
	"L": { technologies: ['mirrorless'] },
	"Z": { technologies: ['mirrorless'] },
	"EF-M": { technologies: ['mirrorless'], aliases: ['eos-m'] },
	"RF": { technologies: ['mirrorless'], aliases: ['eos-r', 'rf-s'] },
	"MFT": { technologies: ['SLR', 'mirrorless'], aliases: ['m43'] },
	"T": { technologies: ['SLR'] },
	"CX": { technologies: ['SLR'], aliases: ['nikon-cx'] },
}

export const LENS_MOUNT_ALLOWLIST = keyedListToSortedAllowlist<LensMount>(LENS_MOUNT_DATA);
