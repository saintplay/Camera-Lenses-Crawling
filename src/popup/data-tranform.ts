import { groupBy } from "lodash";

import { ApertureLimit, FocalLength, LensDescription, MountSensorOption } from "../types";

function getMountSensorOptionsDescriptor(mountSensorOptions: MountSensorOption[]) {
    return Object.entries(
        groupBy(
            mountSensorOptions,
            (option) => option.sensorCoverage
        )).map(
            ([sensorCoverage, mOptions]) =>
                `${sensorCoverage} (${mOptions.map((opt) => opt.lensMount
                ).join(', ')})`
        ).join(' ');
}

function getMinFocalLength(focalLength: FocalLength) {
    if (focalLength.type === 'prime') {
        return focalLength.length
    }

    return focalLength.minLength
}

function getMaxFocalLength(focalLength: FocalLength) {
    if (focalLength.type === 'prime') {
        return focalLength.length
    }

    return focalLength.maxLength
}

function getFocalDescriptor(lensDescription: Partial<LensDescription>) {
    const descriptionArray = [];

    if (typeof lensDescription.AF !== 'undefined') {
        descriptionArray.push(lensDescription.AF ? 'AF' : 'MF')
    }
    
    if (lensDescription.macro) {
        descriptionArray.push('Macro')
    }

    if (lensDescription.OIS) {
        descriptionArray.push('OIS')
    }

    return descriptionArray.join(' ');
}

function getApertureDescriptor(apertureLimit: ApertureLimit) {
    if (typeof apertureLimit === 'number') {
        return `f/${apertureLimit}`;
    }

    return `f/${apertureLimit[0]} - f/${apertureLimit[1]}`;
}

export function getTabbedDescription(lensDescription: Partial<LensDescription>) {
	const resultArray = [
		lensDescription.brand,
		lensDescription.line,
		lensDescription.mountSensorOptions ? getMountSensorOptionsDescriptor(lensDescription.mountSensorOptions) : undefined,
		lensDescription.focalLength ? getMinFocalLength(lensDescription.focalLength) : undefined,
		lensDescription.focalLength ? getMaxFocalLength(lensDescription.focalLength) : undefined,
		getFocalDescriptor(lensDescription),
		lensDescription.maximumAperture ? getApertureDescriptor(lensDescription.maximumAperture) : undefined,
		lensDescription.minimumAperture ? getApertureDescriptor(lensDescription.minimumAperture) : undefined,
		lensDescription.minimumFocusDistanceCM,
		lensDescription.filterSize,
		lensDescription.weightGR,
		lensDescription.currentPrice,
		lensDescription.fullPrice,
		lensDescription.buyingLink,
	];

	return resultArray.join('\t');
}