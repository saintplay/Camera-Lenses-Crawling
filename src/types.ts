import { CrawleableProperty } from "./crawling/models/CrawlingBase";
import { LensBrand } from "./data/lens-brands";
import { LensMount, SensorCoverage } from "./data/optics";

export interface MountSensorOption {
    lensMount: LensMount;
    sensorCoverage?: SensorCoverage;
}

export type FocalLength = { type: 'prime'; length: number } | { type: 'zoom'; minLength: number, maxLength: number }

export type ApertureLimit = number | [number, number]

export interface BasicLensIdentifier {
	brand: LensBrand,
	focalLength: FocalLength,
	maximumAperture: ApertureLimit,
}

export interface LensOpticalDescription extends BasicLensIdentifier {
	line: string;
	mountSensorOptions: MountSensorOption[];
	minimumAperture: ApertureLimit;
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

export interface StoreItemDescription {
	currentPrice: number;
	fullPrice: number;
	buyingLink: string;
}

export type LensDescription = LensOpticalDescription & StoreItemDescription;

export type CrawleableLensDescription = {
	[property in keyof LensDescription]: CrawleableProperty<LensDescription[property]>;
}
