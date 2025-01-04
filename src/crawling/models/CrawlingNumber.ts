import { CrawleableProperty, CrawlingBase, CrawlingContext } from "./CrawlingBase";

export class CrawlingNumber extends CrawlingBase<number> {
	protected constructor(property: CrawleableProperty<number>, context: CrawlingContext) {
		super(property, context);
	}

	static createWithValue(value: number, context: CrawlingContext) {
        return CrawlingNumber.baseCreateWithValue(value, context) as CrawlingNumber;
	}

	static createWithError(error: string, context: CrawlingContext) {
        return CrawlingNumber.baseCreateWithError(error, context) as CrawlingNumber;
	}

	/** Expected group to capture number is 1 */	
	static captureWithRegExp(value: string, regExp: RegExp, context: CrawlingContext): CrawlingNumber {
		const centimetersCapture = Array.from(value.matchAll(regExp))
		if (centimetersCapture.length > 1) {
			return CrawlingNumber.createWithError(`text "${value}" matches multiple times with "${regExp}"`, context);
		}

		const [matches] = centimetersCapture;
		if (!matches || matches.length === 0) {
			return CrawlingNumber.createWithError(`text "${value}" did not match with "${regExp}"`, context);
		}

		const [, finalMatch] = matches;
		if (typeof finalMatch === 'undefined') {
			return CrawlingNumber.createWithError(`text "${value}" did not match with "${regExp}"`, context);
		}

		const finalMatchNunber = Number(finalMatch);
		if (Number.isNaN(finalMatchNunber)) {
			return CrawlingNumber.createWithError(`text "${value}" match with "${regExp}" as a NaN: ${finalMatch}`, context);
		}

		return CrawlingNumber.createWithValue(finalMatchNunber, context);
	}
}
