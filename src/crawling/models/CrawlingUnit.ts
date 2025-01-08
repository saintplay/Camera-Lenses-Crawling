import configureMeasurements from 'convert-units';
import length, { LengthSystems, LengthUnits } from 'convert-units/definitions/length';
import mass, { MassSystems, MassUnits } from 'convert-units/definitions/mass';

import { CrawleableProperty, CrawlingBase, CrawlingContext } from "./CrawlingBase";
import { CrawlingNumber } from './CrawlingNumber';

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

interface Weight {
	value: number;
	unit: 'g' | 'kg'
}

export class CrawlingDistance extends CrawlingBase<Distance> {
	protected constructor(property: CrawleableProperty<Distance>, context: CrawlingContext) {
		super(property, context);
	}

	static createWithValue(value: Distance, context: CrawlingContext) {
		return new CrawlingDistance({ success: true, value }, context)
	}

	static createWithError(error: string, context: CrawlingContext) {
		return new CrawlingDistance({ success: false, error }, context)
	}


	static parseFromText(text: string, context: CrawlingContext): CrawlingDistance {
		// Sample: 27.9 cm
		const centimetersCapture = CrawlingNumber.captureWithRegExp(text, /(\d+(?:\.\d+)?)\s?cm\b/gmi, context)
		// Sample: 0.3m
		const metersCapture = CrawlingNumber.captureWithRegExp(text, /((?:\d+\.)?\d+)\s?m\b/gmi, context)
		// Sample: 5" / 127 mm
		const milimetersCapture = CrawlingNumber.captureWithRegExp(text, /(\d+(?:\.\d+)?)\s?mm\b/gmi, context)

		const validCaptures: CrawlingNumber[] = []

		if (centimetersCapture._property.success) validCaptures.push(centimetersCapture);
		if (metersCapture._property.success) validCaptures.push(metersCapture);
		if (milimetersCapture._property.success) validCaptures.push(milimetersCapture);

		if (validCaptures.length === 0) {
			return CrawlingDistance.createWithError(`text "${text}" did not match with any unit`, context)
		}
		if (validCaptures.length > 1) {
			return CrawlingDistance.createWithError(`text "${text}" matched with multiple units`, context);
		}

		if (centimetersCapture._property.success) return CrawlingDistance.createWithValue({ value: centimetersCapture._property.value, unit: 'cm' }, context)

		if (metersCapture._property.success) return CrawlingDistance.createWithValue({ value: metersCapture._property.value, unit: 'm' }, context)

		if (milimetersCapture._property.success) return CrawlingDistance.createWithValue({ value: milimetersCapture._property.value, unit: 'mm' }, context)

		return CrawlingDistance.createWithError(`Unreachable code parsing unit from text`, context);
	}

	toCentimetersValue(): CrawlingNumber {
		if (!this._property.success) return CrawlingNumber.createWithError(this._property.error, this._context);
		
		return CrawlingNumber.createWithValue(Math.round(convert(this._property.value.value).from(this._property.value.unit).to('cm')), this._context)
	}
}

export class CrawlingWeight extends CrawlingBase<Weight> {
	protected constructor(property: CrawleableProperty<Weight>, context: CrawlingContext) {
		super(property, context);
	}

	static createWithValue(value: Weight, context: CrawlingContext) {
		return new CrawlingWeight({ success: true, value }, context)
	}

	static createWithError(error: string, context: CrawlingContext) {
		return new CrawlingWeight({ success: false, error }, context)
	}


	static parseFromText(text: string, context: CrawlingContext): CrawlingWeight {
		// Sample: 570 g
		const gramsCapture = CrawlingNumber.captureWithRegExp(text, /(\d+(?:\.\d+)?)\s?g\b/gmi, context)
		// Sample: 1.33 kg
		const kilogramsCapture = CrawlingNumber.captureWithRegExp(text, /(\d+(?:\.\d+)?)\s?kg\b/gmi, context)

		const validCaptures: CrawlingNumber[] = []

		if (gramsCapture._property.success) validCaptures.push(gramsCapture);
		if (kilogramsCapture._property.success) validCaptures.push(kilogramsCapture);

		if (validCaptures.length === 0) {
			return CrawlingWeight.createWithError(`text "${text}" did not match with any unit`, context)
		}
		if (validCaptures.length > 1) {
			return CrawlingWeight.createWithError(`text "${text}" matched with multiple units`, context);
		}

		if (gramsCapture._property.success) return CrawlingWeight.createWithValue({ value: gramsCapture._property.value, unit: 'g' }, context)

		if (kilogramsCapture._property.success) return CrawlingWeight.createWithValue({ value: kilogramsCapture._property.value, unit: 'kg' }, context)

		return CrawlingWeight.createWithError(`Unreachable code parsing unit from text`, context);
	}

	toGrams(): CrawlingNumber {
		if (!this._property.success) return CrawlingNumber.createWithError(this._property.error, this._context);
		
		return CrawlingNumber.createWithValue(Math.round(convert(this._property.value.value).from(this._property.value.unit).to('g')), this._context)
	}
}