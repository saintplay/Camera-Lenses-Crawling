import { AllowList } from "../data/data";
import { CrawlingBase, CrawlingCollection, CrawlingContext } from "./base";
import { CrawlingDistance } from "./units";

/**
 * Enforced to always have at least one non-empty character
 */
export class CrawlingText<T extends string = string> extends CrawlingBase {
    private _text: T;

    constructor(text: T, context: CrawlingContext) {
        super(context);

        if (text.trim() === '') throw this.getError(`text is empty`);

        this._text = text;
    }

    private _extractWithRegExp(regExp: RegExp, groupIndexing: number, disableThrow: false): CrawlingText;
    private _extractWithRegExp(regExp: RegExp, groupIndexing: number, disableThrow: true): CrawlingText | null ;
    private _extractWithRegExp(regExp: RegExp, groupIndexing: number[], disableThrow: false): CrawlingTexts;
    private _extractWithRegExp(regExp: RegExp, groupIndexing: number[], disableThrow: true): CrawlingTexts | null;
    private _extractWithRegExp(regExp: RegExp, groupIndexing: number | number[], disableThrow: boolean): CrawlingText | CrawlingTexts | null {
        const matchesArray = Array.from(this._text.matchAll(regExp));

        if (matchesArray.length > 1) {
            if (!disableThrow)
                throw this.getError(`RegExp "${regExp}" match with "${this._text}" multiple times`);
            return null;
        }
        
        const [matches] = matchesArray;

        if (!matches || matches.length === 0) {
            if (!disableThrow)
                throw this.getError(`RegExp "${regExp}" did not match with "${this._text}"`);
            return null;
        }

        if (typeof groupIndexing === 'number') {
            if (typeof matches[groupIndexing] === 'undefined') {
                if (!disableThrow)
                    throw this.getError(`group number ${groupIndexing} does not exist for "${regExp}"`);
                return null;
            }
    
            return new CrawlingText(matches[groupIndexing], this._context)
        }

        // At this point, group indexing is an array
        if (groupIndexing.length === 0) {
            if (!disableThrow)
                throw this.getError(`group indexing does not have any values`);
            return null;
        }

        // First, validate the existence of wanted groups
        for (const groupIndex of groupIndexing) {
            if (typeof matches[groupIndex] === 'undefined') {
                if (!disableThrow)
                    throw this.getError(`group number ${groupIndexing} does not exist for "${regExp}"`);
                return null
            }
        }
        
        // Then, Return wanted groups
        return new CrawlingTexts(groupIndexing.map(wantedIndex => new CrawlingText(matches[wantedIndex], this._context)), this._context);
    }

    extractWithRegExp(regExp: RegExp, groupIndexing: number): CrawlingText;
    extractWithRegExp(regExp: RegExp, groupIndexing: number[]): CrawlingTexts;
    extractWithRegExp(regExp: RegExp, groupIndexing: number | number[]): CrawlingText | CrawlingTexts {
        return this._extractWithRegExp(regExp, groupIndexing as number[], false)  // TS Problem: This could be number or number[]. But for compilation let's just stick to one of them.
    }

    extractWithMultipleRegExp(regExps: [RegExp, number[]][]) {
        for (const [regExp, groupIndexing] of regExps) {
            const resultTextContent = this._extractWithRegExp(regExp, groupIndexing, true) // TS Problem: This could be number or number[]. But for compilation let's just stick to one of them.
            if (resultTextContent) return resultTextContent
        }
        throw this.getError(`text ${this._text} did not match with any regexp`);
    }


    extractWithAllowlist<K extends string = string>(allowlist: AllowList<K>, matchWholeWords = false) {
        const lowercaseText = this._text.toLowerCase();

        const lowercaseFlattenAllowList = allowlist.map(i => [
            i.name.toLowerCase(),
            ...(i.aliases ? i.aliases.map(a => a.toLowerCase()) : [])
        ])

        for (const index in lowercaseFlattenAllowList) {
            const allowNameAndAliases = lowercaseFlattenAllowList[index]

            let founded: boolean;
            if (matchWholeWords) {
                founded = Boolean(allowNameAndAliases.find(txt => new RegExp(`\\b${txt}\\b`, 'gm').test(lowercaseText)))
            } else {
                founded = Boolean(allowNameAndAliases.find(txt => lowercaseText.includes(txt)))
            }

            if (founded) {
                // Use the original allowList since it was not transformed to lowercase
                return new CrawlingText<K>(allowlist[index].name, this._context)
            }
        }

        throw this.getError('element not found with allowlist'); 
    }

    subtractLiterals(texts: string[]) {
        const reducedText = texts.reduce(
            (acc, curr) => {
                const regExpEscapedText = curr.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
                return acc.replace(new RegExp(regExpEscapedText, 'gmi'), '')
            },
            this._text
        )

        return new CrawlingText(reducedText, this._context)
    }

    matchesRegExp(regExp: RegExp) {
        return regExp.test(this._text)
    }

    toDistance() {
        return CrawlingDistance.parseFromText(this._text, this._context);
    }

    toNumber() {
        const number = Number(this._text);

        if (Number.isNaN(number)) throw this.getError(`"${this._text}" was expected to be a number`);
    
        return number;
    }

    toText() {
        return this._text;
    }
}

/**
 * Enforced to always have at least one element
 */
export class CrawlingTexts extends CrawlingCollection<CrawlingText> {
    constructor(texts: CrawlingText[], context: CrawlingContext) {
        super(texts, context);

        if (texts.length === 0) throw this.getError(`returned zero text elements`)

        this._collection = texts;
    }
}