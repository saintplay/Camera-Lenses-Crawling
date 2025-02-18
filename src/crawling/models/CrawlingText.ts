import { AllowList, getAllowlistItem, MatchingStyle } from "../../data/data";
import { readTextFromTableImage } from "../../genai/vision";
import { escapeForRegex } from "../utils";
import { CrawleableProperty, CrawlingBase, CrawlingCollection, CrawlingCollectionClassConstructor, CrawlingContext, EnsuredSuccess } from "./CrawlingBase";
import { CrawlingBoolean } from "./CrawlingBoolean";
import { CrawlingElement } from "./CrawlingDom";
import { CrawlingNumber } from "./CrawlingNumber";
import { CrawlingDistance, CrawlingWeight } from "./CrawlingUnit";

/**
 * Enforced to always have at least one non-empty character
 */
export class CrawlingText<TextType extends string = string> extends CrawlingBase<TextType> {
    constructor(property: CrawleableProperty<TextType>, context: CrawlingContext) {
        super(property, context);

        if (property.success && property.value.trim() === '') {
            this._property = { success: false, error: 'text is empty' } as CrawleableProperty<TextType>;
        }
    }

    static createWithValue<T extends string = string>(value: T, context: CrawlingContext) {
        return CrawlingText.baseCreateWithValue<T>(value, context) as CrawlingText<T>;
    }

    static createWithError<T extends string = string>(error: string, context: CrawlingContext) {
        return CrawlingText.baseCreateWithError<T>(error, context) as CrawlingText<T>;
    }

    static createFromBase<T extends string = string>(crawl: CrawlingBase<T>) {
        return new CrawlingText(crawl._property, crawl._context);
    }

    extractWithRegExp(regExp: RegExp, groupIndexing: number): CrawlingText;
    extractWithRegExp(regExp: RegExp, groupIndexing: number[]): CrawlingTexts;
    extractWithRegExp(regExp: RegExp, groupIndexing: number | number[]): CrawlingText | CrawlingTexts {
        if (!this._property.success) {
            if (typeof groupIndexing === 'number') {
                return CrawlingText.createWithError(this._property.error, this._context);
            }
            return CrawlingTexts.createWithError(this._property.error, this._context);
        }


        const matchesArray = Array.from(this._property.value.matchAll(regExp));

        if (matchesArray.length > 1) {
            if (typeof groupIndexing === 'number') {
                return CrawlingText.createWithError(`RegExp "${regExp}" match with "${this._property.value}" multiple times`, this._context);
            }
            return CrawlingTexts.createWithError(`RegExp "${regExp}" match with "${this._property.value}" multiple times`, this._context);
        }

        const [matches] = matchesArray;

        if (!matches || matches.length === 0) {
            if (typeof groupIndexing === 'number') {
                return CrawlingText.createWithError(`RegExp "${regExp}" did not match with "${this._property.value}"`, this._context);
            }
            return CrawlingTexts.createWithError(`RegExp "${regExp}" did not match with "${this._property.value}"`, this._context);
        }

        if (typeof groupIndexing === 'number') {
            if (typeof matches[groupIndexing] === 'undefined') {
                return CrawlingText.createWithError(`group number ${groupIndexing} does not exist for "${regExp}"`, this._context);
            }

            return CrawlingText.createWithValue(matches[groupIndexing], this._context)
        }

        // At this point, group indexing is an array
        if (groupIndexing.length === 0) {
            return CrawlingTexts.createWithError('group indexing does not have any values', this._context);
        }

        // First, validate the existence of wanted groups
        for (const groupIndex of groupIndexing) {
            if (typeof matches[groupIndex] === 'undefined') {
                return CrawlingTexts.createWithError(`group number ${groupIndexing} does not exist for "${regExp}"`, this._context);
            }
        }

        // Then, Return wanted groups
        return CrawlingTexts.createWithValue(groupIndexing.map(wantedIndex => matches[wantedIndex], this._context), this._context);
    }

    extractWithMultipleRegExp(regExps: [RegExp, number[]][]): CrawlingTexts {
        if (!this._property.success) return CrawlingTexts.createWithError(this._property.error, this._context);

        for (const [regExp, groupIndexing] of regExps) {
            const resultTextContent = this.extractWithRegExp(regExp, groupIndexing) // TS Problem: This could be number or number[]. But for compilation let's just stick to one of them.

            if (resultTextContent._property.success) return resultTextContent;
        }

        return CrawlingTexts.createWithError(`text ${this._property.value} did not match with any regexp`, this._context);
    }

    extractWithAllowlist<K extends string = string>(allowlist: AllowList<K> | CrawlingBase<AllowList<K>>, matchStyle: MatchingStyle = 'anywhere'): CrawlingText<K> {
        if (!this._property.success) return CrawlingText.createWithError(this._property.error, this._context);

        if (allowlist instanceof CrawlingBase) {
            if (!allowlist._property.success) return CrawlingText.createWithError(allowlist._property.error, allowlist._context);
        }

        const actualAllowlist = allowlist instanceof CrawlingBase ?
            (allowlist as EnsuredSuccess<typeof allowlist, AllowList<K>>)._property.value :
            allowlist;

        const foundedInAllowlistItem = getAllowlistItem(actualAllowlist, this._property.value, matchStyle)

        if (foundedInAllowlistItem) {
            return CrawlingText.createWithValue<K>(foundedInAllowlistItem.name, this._context)   
        }

        return CrawlingText.createWithError(`element "${this._property.value}" not found with allowlist`, this._context);
    }

    subtractLiterals<T extends string>(texts: T[] | CrawlingCollection<T>): CrawlingText {
        if (!this._property.success) return CrawlingText.createWithError(this._property.error, this._context);

        if (texts instanceof CrawlingCollection) {
            if (!texts._property.success) return CrawlingText.createWithError(texts._property.error, texts._context);
        }

        const textsToSubstract = texts instanceof CrawlingCollection ?
            (texts as EnsuredSuccess<typeof texts, T[]>)._property.value :
            texts;

        const reducedText = textsToSubstract.reduce(
            (acc, curr) => {
                const regExpEscapedText = escapeForRegex(curr)
                return acc.replace(new RegExp(regExpEscapedText, 'gmi'), '')
            },
            this._property.value as string
        )

        return CrawlingText.createWithValue(reducedText, this._context)
    }

    matchesRegExp(regExp: RegExp): CrawlingBoolean {
        if (!this._property.success) return CrawlingBoolean.baseCreateWithError(this._property.error, this._context);


        return CrawlingBoolean.baseCreateWithValue(regExp.test(this._property.value), this._context)
    }

    toDistance(): CrawlingDistance {
        if (!this._property.success) return CrawlingDistance.createWithError(this._property.error, this._context)

        return CrawlingDistance.parseFromText(this._property.value, this._context);
    }

    toWeight(): CrawlingWeight {
        if (!this._property.success) return CrawlingWeight.createWithError(this._property.error, this._context)

        return CrawlingWeight.parseFromText(this._property.value, this._context);
    }

    toNumber(): CrawlingNumber {
        if (!this._property.success) return CrawlingNumber.baseCreateWithError(this._property.error, this._context)

        const number = Number(this._property.value);

        if (Number.isNaN(number)) return CrawlingNumber.baseCreateWithError(`"${this._property.value}" was expected to be a number`, this._context);

        return CrawlingNumber.baseCreateWithValue(number, this._context);
    }
}

export class CrawlingTexts extends CrawlingCollection<string> {
    constructor(property: CrawleableProperty<string[]>, context: CrawlingContext) {
        super(property, context);
    }

    static createWithValue(value: string[], context: CrawlingContext) {
        return CrawlingTexts.baseCreateWithValue(value, context) as CrawlingTexts;
    }

    static createWithError(error: string, context: CrawlingContext) {
        return CrawlingTexts.baseCreateWithError(error, context) as CrawlingTexts;
    }

    static async fromTableImage(element: CrawlingElement): Promise<CrawlingTexts> {
		if (!element._property.success) return CrawlingTexts.createWithError(element._property.error, element._context);

        const src = element._property.value.getAttribute('src')

        if (!src) return CrawlingTexts.createWithError(`element "${element._property.value.tagName}" did not have a src attribute`, element._context);

        try {
            const textResult = await readTextFromTableImage(src)
            console.log('Extracted text from image with genAI')
            console.log(textResult)
            return CrawlingTexts.createWithValue(textResult.split('\n'), element._context);
        } catch (error) {
            return CrawlingTexts.createWithError(String(error), element._context);
        }
    }

    static concatTextSuccessfulls(collections: CrawlingTexts[]) {
        return super.concatSuccessfulls(collections, CrawlingTexts) as CrawlingTexts;
    }

    getFirst() {
        return super.getFirst(CrawlingText) as CrawlingText;
    }

    getItem(index: number) {
        return super.getItem(index, CrawlingText) as CrawlingText;
    }

    map<NewNativeType>(mapCb: (element: EnsuredSuccess<CrawlingText, string>) => CrawlingBase<NewNativeType>): CrawlingCollection<NewNativeType> {
        return super.map(mapCb as (element: EnsuredSuccess<CrawlingBase<string>, string>) => CrawlingBase<NewNativeType>, CrawlingText);
    }

    /**
     * Use .map instead if you don't need to change the collection type (default: CrawlingCollection)
     */
    mapTexts<NewNativeType>(
        mapCb: (element: EnsuredSuccess<CrawlingText, string>) => CrawlingBase<NewNativeType>,
        collectionCtor: CrawlingCollectionClassConstructor<CrawlingCollection<NewNativeType>, NewNativeType> = CrawlingCollection<NewNativeType>
    ): CrawlingCollection<NewNativeType> {
        return super.map<NewNativeType>(mapCb as (text: EnsuredSuccess<CrawlingBase<string>, string>) => CrawlingBase<NewNativeType>, CrawlingText, collectionCtor);
    }

    findByRegExp(regExp: RegExp): CrawlingText {
		if (!this._property.success) return CrawlingText.createWithError(this._property.error, this._context);

        for (const text of this._property.value) {
            if (regExp.test(text)) {
                return CrawlingText.createWithValue(text, this._context);
            }
        }

        return CrawlingText.createWithError(`No text found by RegExp "${regExp}"`, this._context);
    }
}