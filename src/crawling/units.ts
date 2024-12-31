import configureMeasurements from 'convert-units';
import length, { LengthSystems, LengthUnits } from 'convert-units/definitions/length';
import mass, { MassSystems, MassUnits } from 'convert-units/definitions/mass';

import { CrawlingBase, CrawlingContext } from "./base";

const convert = configureMeasurements<
	"length" | "mass",
	LengthSystems | MassSystems,
	LengthUnits | MassUnits>({
		length, mass
	});

interface Distance {
	value: number;
	unit: 'cm' | 'm' | 'mm'
}

/** Expected group capture to match is 1 */
function getRegexCaptureResult(value: string, regExp: RegExp, unitContext: string, context?: CrawlingContext) {
	const centimetersCapture = Array.from(value.matchAll(regExp))
	if (centimetersCapture.length > 1) {
		throw CrawlingBase.getErrorWithContext(`text "${value}" matches multiple times with "${unitContext}"`, context);
	}

	const [matches] = centimetersCapture;
	if (!matches || matches.length === 0) {
		return null
	}

	const [, finalMatch] = matches;
	if (typeof finalMatch === 'undefined') {
		return null
	}

	const finalMatchNunber = Number(finalMatch);
	if (Number.isNaN(finalMatchNunber)) {
		throw CrawlingBase.getErrorWithContext(`text "${value}" matched with "${unitContext}" but is not a string`, context);
	}

	return finalMatchNunber;
}

export class CrawlingDistance extends CrawlingBase {
	private _distance: Distance;

	constructor(distance: Distance, context: CrawlingContext) {
		super(context);

		this._distance = distance;
	}


	static parseFromText(text: string, context: CrawlingContext) {
		// Sample: 27.9 cm
		const centimetersCapture = getRegexCaptureResult(text, /(\d+(?:\.\d+)?)\s?cm\b/gmi, 'cm', context)
		// Sample: 0.3m
		const metersCapture = getRegexCaptureResult(text, /((?:\d+\.)?\d+)\s?m\b/gmi, 'm', context)
		// Sample: 5" / 127 mm
		const milimetersCapture = getRegexCaptureResult(text, /(\d+(?:\.\d+)?)\s?mm\b/gmi, 'mm', context)

		const validCaptures: number[] = []

		if (centimetersCapture) validCaptures.push(centimetersCapture);
		if (metersCapture) validCaptures.push(metersCapture);
		if (milimetersCapture) validCaptures.push(milimetersCapture);

		if (validCaptures.length === 0) {
			throw CrawlingBase.getErrorWithContext(`text "${text}" did not match with any unit`, context);
		}
		if (validCaptures.length > 1) {
			throw CrawlingBase.getErrorWithContext(`text "${text}" matched with multiple units`, context);
		}

		if (centimetersCapture) return new CrawlingDistance({ value: centimetersCapture, unit: 'cm' }, context)

		if (metersCapture) return new CrawlingDistance({ value: metersCapture, unit: 'm' }, context)

		if (milimetersCapture) return new CrawlingDistance({ value: milimetersCapture, unit: 'mm' }, context)

		throw CrawlingBase.getErrorWithContext(`Unreachable code parsing unit from text`, context);
	}

	toCentimetersValue() {
		return Math.round(convert(this._distance.value).from(this._distance.unit).to('cm'))
	}
}