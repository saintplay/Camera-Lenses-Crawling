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
	"PL",
	"EF",
	"EF-S",
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
] as const;

export type LensMount = typeof LENS_MOUNTS[number];

export const LENS_MOUNT_DATA: {
	[lm in LensMount]: Omit<AllowListItem, 'name'> & {
		technologies: ('SLR' | 'mirrorless')[];
		priorityIndex?: number;
	}
} = {
	"M42": { technologies: ['SLR'] },
	"PL": { technologies: ['SLR'] },
	"EF": { technologies: ['SLR'] },
	"EF-S": { technologies: ['SLR'] },
	"F": { technologies: ['SLR'] },
	"K": { technologies: ['SLR'] },
	"M": { technologies: ['SLR'] },
	"E": { technologies: ['mirrorless'] },
	"X": { technologies: ['mirrorless'] },
	"L": { technologies: ['mirrorless'] },
	"Z": { technologies: ['mirrorless'] },
	"EF-M": { technologies: ['mirrorless'] },
	"RF": { technologies: ['mirrorless'] },
	"MFT": { technologies: ['SLR', 'mirrorless'], aliases: ['M43'] },
}

export const LENS_MOUNT_ALLOWLIST = keyedListToSortedAllowlist<LensMount>(LENS_MOUNT_DATA);
