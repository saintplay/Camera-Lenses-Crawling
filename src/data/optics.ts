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
	"Full-Frame": {
		aliases: ['ff', 'Full Frame']
	}
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
	"E": { technologies: ['mirrorless'], aliases: ['fe', 'nex', 'nex-e', 'Sony E'] },
	"X": { technologies: ['mirrorless'], aliases: ["fujifilm x", 'fx'] },
	"L": { technologies: ['mirrorless'] },
	"Z": { technologies: ['mirrorless'] },
	"EF-M": { technologies: ['mirrorless'], aliases: ['eos-m', 'efm', 'Canon EF-M'] },
	"RF": { technologies: ['mirrorless'], aliases: ['eos-r', 'rf-s'] },
	"MFT": { technologies: ['SLR', 'mirrorless'], aliases: ['m43', 'Micro Four Thirds'] },
	"T": { technologies: ['SLR'] },
	"CX": { technologies: ['SLR'], aliases: ['nikon-cx'] },
}

export const LENS_MOUNT_ALLOWLIST = keyedListToSortedAllowlist<LensMount>(LENS_MOUNT_DATA);

// Lens mounts that have great compatibility to be used with modern mirrorless cameras (with adaptors)
// These are mostly DSLR or have no electronics at all
export const SEEKING_LENS_MOUNTS = [
	"M42",
	"M39",
	"PL",
	"EF",
	"F",
	"K",
	"M",
	"X", // The only Mirrorless mount I personally seek, because I own a Fuji
] as const

export type SeekingLensMount = typeof SEEKING_LENS_MOUNTS[number];

export const SEEKING_LENS_MOUNT_ALLOWLIST = keyedListToSortedAllowlist<SeekingLensMount>(
	Object.fromEntries(
		Object.entries(LENS_MOUNT_DATA).
			filter(([mount]) => SEEKING_LENS_MOUNTS.includes(mount as SeekingLensMount))
	));
