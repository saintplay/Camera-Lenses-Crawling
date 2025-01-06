import { CrawleableProperty, CrawlingBase, CrawlingCollection, CrawlingContext } from "./CrawlingBase";
import { CrawlingText } from "./CrawlingText";

export class CrawlingElement extends CrawlingBase<Element> {
    constructor(property: CrawleableProperty<Element>, context: CrawlingContext) {
        super(property, context);
    }

    static createWithValue(value: Element, context: CrawlingContext) {
        return new CrawlingElement({ success: true, value }, context)
    }

    static createWithError(error: string, context: CrawlingContext) {
        return new CrawlingElement({ success: false, error }, context)
    }

    getTextContent(): CrawlingText {
        if (!this._property.success) return CrawlingText.createWithError(this._property.error, this._context);

        if (!this._property.value.textContent) return CrawlingText.createWithError('text content not found', this._context)

        return CrawlingText.createWithValue(this._property.value.textContent, this._context);
    }

    getNextElementSibiling(): CrawlingElement {
        if (!this._property.success) return CrawlingElement.createWithError(this._property.error, this._context);

        const next = this._property.value.nextElementSibling;
        if (!next) return CrawlingElement.createWithError('sibiling not found', this._context);

        return CrawlingElement.createWithValue(next, this._context);
    }
}

/**
 * Enforced to always have at least one value
 */
export class CrawlingElements extends CrawlingCollection<Element> {
    private constructor(property: CrawleableProperty<Element[]>, context: CrawlingContext) {
        super(property, context);
    }

    static createWithValue(value: Element[], context: CrawlingContext) {
        return CrawlingElements.baseCreateWithValue(value, context) as CrawlingElements;
    }

    static createWithError(error: string, context: CrawlingContext) {
        return CrawlingElements.baseCreateWithError(error, context) as CrawlingElements;
    }

    static getBySelector(selectorPath: string, contentContext?: string): CrawlingElements {
        const elements = document.querySelectorAll(selectorPath);
        const newContext = { selectorPath, content: contentContext }

        return CrawlingElements.createWithValue(Array.from(elements).map(element => element), newContext);
    }

    findByTextContent(regExp: RegExp): CrawlingElement {
        if (!this._property.success) return CrawlingElement.createWithError(this._property.error, this._context)


        const foundElement = this._property.value.find(element => element.textContent?.match(regExp))
        if (!foundElement) {
            return CrawlingElement.createWithError(`nothing found by text content "${regExp}"`, this._context)
        }

        return CrawlingElement.createWithValue(foundElement, this._context)
    }

    getFirst() {
        return super.getFirst(CrawlingElement) as CrawlingElement;
    }

    getItem(index: number) {
        return super.getItem(index) as CrawlingElement;
    }
}
