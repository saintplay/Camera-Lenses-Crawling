import { cloneDeep, isEqual } from "lodash";

import { CrawlingBase } from "./crawling/models/CrawlingBase";
import { LensBrand } from "./data/lens-brands";
import { LensMount, SensorCoverage } from "./data/optics";

export interface MountSensorOption {
	lensMount: LensMount;
	sensorCoverage: SensorCoverage;
}

export type FocalLength = { type: 'prime'; length: number } | { type: 'zoom'; minLength: number, maxLength: number }

export type ApertureLimit = number | [number, number]

export interface BasicLensIdentifier {
	brand: LensBrand;
	focalLength: FocalLength;
	maximumAperture: ApertureLimit;
}

export interface ComplementaryOpticalDescription {
	line: string;
	mountSensorOptions: MountSensorOption[];
	minimumAperture: ApertureLimit;
	minimumFocusDistanceCM: number;
	AF: boolean;
	OIS: boolean;
	macro: boolean;
	// TODO: Evaluate if we need the folowing data
	// AE: boolean; // Automatic Chip
	// cine: boolean
	// anamorphic: boolean;
	// pancake: boolean;
	// fisheye: boolean;
	// tiltshift: boolean;
	// zoomshift: boolean;
	filterSize: number;
	weightGR: number;
}

export interface StoreItemDescription {
	currentPrice: number;
	fullPrice: number;
}
export interface ProducWithLinks {
	productLink: string;
	bhPhotoVideoLink: string;
	adoramaLink: string;
	amazonLink: string;
}

export type ComplementaryDescription = ComplementaryOpticalDescription & StoreItemDescription & ProducWithLinks;

export type LensDescription = BasicLensIdentifier & Partial<ComplementaryDescription>;

// TODO: Stop making this required for every single field, instead default to === in the caller function
const LENS_DESCRIPTION_COMPARER: { [property in keyof Required<LensDescription>]: (v1: NonNullable<LensDescription[property]>, v2: NonNullable<LensDescription[property]>) => boolean } = {
	brand: (v1, v2) => v1 == v2,
	focalLength: (v1, v2) => {
		if (v1.type !== v2.type) return false;

		if (v1.type === 'prime' && v2.type === 'prime') {
			return v1.length === v2.length;
		}

		if (v1.type === 'zoom' && v2.type === 'zoom') {
			return v1.minLength === v2.minLength && v1.maxLength === v2.maxLength;
		}

		throw new Error('unreachable code')

	},
	maximumAperture: (v1, v2) => {
		if (typeof v1 !== typeof v2) return false;

		if (typeof v1 === 'number') {
			return v1 == v2;
		}

		if (typeof v1 === 'object' && typeof v2 === 'object') {
			return v1[0] === v2[0] && v1[1] === v2[1];
		}

		throw new Error('unreachable code')
	},
	line: (v1, v2) => v1 === v2,
	mountSensorOptions: (v1, v2) => isEqual(v1, v2),
	// TODO: Implement the correct comparer
	minimumAperture: (v1, v2) => v1 === v2,
	minimumFocusDistanceCM: (v1, v2) => v1 === v2,
	AF: (v1, v2) => v1 === v2,
	OIS: (v1, v2) => v1 === v2,
	macro: (v1, v2) => v1 === v2,
	filterSize: (v1, v2) => v1 === v2,
	weightGR: (v1, v2) => v1 === v2,
	currentPrice: (v1, v2) => v1 === v2,
	fullPrice: (v1, v2) => v1 === v2,
	productLink:(v1, v2) => v1 === v2,
	bhPhotoVideoLink:(v1, v2) => v1 === v2,
	adoramaLink:(v1, v2) => v1 === v2,
	amazonLink:(v1, v2) => v1 === v2,
}

const LENS_DESCRIPTION_MERGER: { [property in keyof Partial<LensDescription>]: (v1: NonNullable<LensDescription[property]>, v2: NonNullable<LensDescription[property]>) => NonNullable<LensDescription[property]> } = {
	currentPrice: (v1, v2) => v1 < v2 ? v1 : v2,
	fullPrice: (v1, v2) => v1 > v2 ? v1 : v2,
}

export type CrawleableLensDescription = {
	[property in keyof LensDescription]: CrawlingBase<NonNullable<LensDescription[property]>>;
}

export const isIncomplete = (lensDescription: LensDescription) => {
	const complementaryDescription: { [property in keyof ComplementaryDescription]: true } = {
		line: true,
		mountSensorOptions: true,
		minimumAperture: true,
		minimumFocusDistanceCM: true,
		AF: true,
		OIS: true,
		macro: true,
		filterSize: true,
		weightGR: true,
		currentPrice: true,
		fullPrice: true,
		productLink: true,
		bhPhotoVideoLink: true,
		adoramaLink: true,
		amazonLink: true,
	}

	for (const descriptor in complementaryDescription) {
		if (typeof lensDescription[descriptor as keyof ComplementaryDescription] === 'undefined') {
			return true;
		}
	}

	return false;
}

export const getBasicLensIdentifier = (lensDescription: LensDescription): BasicLensIdentifier => {
	return {
		brand: lensDescription.brand,
		focalLength: lensDescription.focalLength,
		maximumAperture: lensDescription.maximumAperture,
	}
}

export const descriptionMatchesIdentifier = (lensDescription: LensDescription, lensIdentifier: BasicLensIdentifier) => {
	const originalIdentifier = getBasicLensIdentifier(lensDescription);

	for (const prop in originalIdentifier) {
		const property = prop as keyof BasicLensIdentifier;
		const value = originalIdentifier[property];

		if (typeof originalIdentifier[property] === 'undefined' || typeof lensIdentifier[property] === 'undefined') {
			return false;
		}
		
		if (!(LENS_DESCRIPTION_COMPARER[property] as (v1: typeof value, v2: typeof value) => boolean)(originalIdentifier[property], lensIdentifier[property])) {
			return false;
		}
	}

	return true;
}

export type MergeValues = { field: string, values: string[] }[]

export const mergeLensDescriptions = (mergeValues: MergeValues, ...lensDescriptions: LensDescription[]): { mergeValues: MergeValues; lensDescription: LensDescription } => {
	if (lensDescriptions.length === 0) {
		throw new Error('no lens descriptions items to merge');
	}

	const basicLensIdentifier = getBasicLensIdentifier(lensDescriptions[0]);

	for (const lensDescription of lensDescriptions) {
		if (!descriptionMatchesIdentifier(lensDescription, basicLensIdentifier)) {
			console.error("Lens Identifier A: ", getBasicLensIdentifier(lensDescription))
			console.error("Lens Identifier B: ", basicLensIdentifier)
			throw new Error('trying to merge different lens descriptions');
		}
	}

	const finalLensDescription: LensDescription = {
		brand: basicLensIdentifier.brand,
		focalLength: basicLensIdentifier.focalLength,
		maximumAperture: basicLensIdentifier.maximumAperture,
	}

	const newMergeValues: MergeValues = cloneDeep(mergeValues);

	for (const lensDescription of lensDescriptions) {
		for (const prop in lensDescription) {
			const property = prop as keyof LensDescription;

			const value = lensDescription[property];
			const finalValue = finalLensDescription[property];

			if (newMergeValues.findIndex(merge => merge.field === property) === -1) {
				newMergeValues.push({ field: property, values: [JSON.stringify(value)] });
			}

			if (typeof value !== 'undefined') {
				if (typeof finalValue === 'undefined') {
					(finalLensDescription[property] as typeof value) = value;
				} else {
					if (!(LENS_DESCRIPTION_COMPARER[property] as (v1: typeof value, v2: typeof value) => boolean)(finalValue, value)) {
						(finalLensDescription[property] as typeof value) = (LENS_DESCRIPTION_MERGER[property] as (v1: typeof value, v2: typeof value) => typeof value)?.(finalValue, value) ?? value;

						
						const merge = newMergeValues.find(merge => merge.field === property);
						if (merge) {
							merge.values.push(JSON.stringify(value));
						}
					}
				}
			}

		}
	}

	return { lensDescription: finalLensDescription, mergeValues: newMergeValues };
}
