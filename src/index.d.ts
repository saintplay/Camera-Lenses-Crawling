import type { Entries } from 'type-fest'

declare global {
	interface ObjectConstructor { 
		entries<T extends object>(o: T): Entries<T> 
	}
}

interface MountSensorOption {
    lensMount: LensMount;
    sensorCoverage?: SensorCoverage;
}

type FocalLength = { type: 'prime'; length: number } | { type: 'zoom'; minLength: number, maxLength: number }

type ApertureLimit = number | [number, number]

interface LensOpticalDescription {
	brand: LensBrand;
	line: string;
	mountSensorOptions: MountSensorOption[];
	focalLength: FocalLength;
	minimumAperture: ApertureLimit;
	maximumAperture: ApertureLimit;
	minimumFocusDistanceCM: number,
	AF: boolean,
	OIS: boolean,
	// TODO: Evaluate if we need the folowing data
	// AE: boolean, // Automatic Chip
	// macro: boolean,
	// cine: boolean
	// anamorphic: boolean,
	// pancake: boolean,
	// fisheye: boolean,
	// tiltshift: boolean,
	// zoomshift: boolean,
	filterSize: number,
	weightGR: number,
}

interface StoreItemDescription {
	currentPrice: number;
	fullPrice: number;
	buyingLink: string;
}


export type LensDescription = LensOpticalDescription & StoreItemDescription;
