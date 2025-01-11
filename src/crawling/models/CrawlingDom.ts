import { CrawleableProperty, CrawlingBase, CrawlingCollection, CrawlingCollectionClassConstructor, CrawlingContext, EnsuredSuccess } from "./CrawlingBase";
import { CrawlingText, CrawlingTexts } from "./CrawlingText";

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

    getBySelector(selectorPath: string): CrawlingElements {
        if (!this._property.success) return CrawlingElements.createWithError(`selector path "${selectorPath}" did not match anything`, this._context);

        const elements = this._property.value.querySelectorAll(selectorPath);
        const newContext = { ...this._context, selectorPath }

        return CrawlingElements.createWithValue(Array.from(elements), newContext);
    }

    getTextContent(): CrawlingText {
        if (!this._property.success) return CrawlingText.createWithError(this._property.error, this._context);

        if (!this._property.value.textContent) return CrawlingText.createWithError('text content not found', this._context)

        return CrawlingText.createWithValue(this._property.value.textContent, this._context);
    }

    getParent(): CrawlingElement {
        if (!this._property.success) return CrawlingElement.createWithError(this._property.error, this._context);

        const parent = this._property.value.parentElement;
        if (!parent) return CrawlingElement.createWithError('parent not found', this._context);

        return CrawlingElement.createWithValue(parent, this._context);
    }

    getChild(nth: number = 0): CrawlingElement {
        if (!this._property.success) return CrawlingElement.createWithError(this._property.error, this._context);

        const child = this._property.value.children.item(nth);
        if (!child) return CrawlingElement.createWithError(`child nth "${nth}" not found`, this._context);

        return CrawlingElement.createWithValue(child, this._context);
    }

    getNextElementSibiling(): CrawlingElement {
        if (!this._property.success) return CrawlingElement.createWithError(this._property.error, this._context);

        const next = this._property.value.nextElementSibling;
        if (!next) return CrawlingElement.createWithError('sibiling not found', this._context);

        return CrawlingElement.createWithValue(next, this._context);
    }

    getAllTextNodesAsText(): CrawlingTexts {
        if (!this._property.success) return CrawlingTexts.createWithError(this._property.error, this._context) ;

        /** @see https://stackoverflow.com/a/10730777 */
        const textNodes: Text[] = []
        const walker = document.createTreeWalker(this._property.value, NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode as Text)
        }

        return CrawlingTexts.createWithValue(textNodes.map(node => node.wholeText), this._context)
    }
}

export class CrawlingElements extends CrawlingCollection<Element> {
    constructor(property: CrawleableProperty<Element[]>, context: CrawlingContext) {
        super(property, context);
    }

    static createWithValue(value: Element[], context: CrawlingContext, { errorOnEmpty }: { errorOnEmpty?: boolean } = {}) {
        if (errorOnEmpty && value.length === 0) {
            return CrawlingElements.baseCreateWithError('tried to create elements collection with zero elements', context) as CrawlingElements;
        }

        return CrawlingElements.baseCreateWithValue(value, context) as CrawlingElements;
    }

    static createWithError(error: string, context: CrawlingContext) {
        return CrawlingElements.baseCreateWithError(error, context) as CrawlingElements;
    }

    static getBySelector(selectorPath: string, contentContext?: string, { errorOnEmpty }: { errorOnEmpty?: boolean } = {}): CrawlingElements {
        const elements = document.querySelectorAll(selectorPath);
        const newContext = { selectorPath, content: contentContext }

        return CrawlingElements.createWithValue(Array.from(elements), newContext, { errorOnEmpty });
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
        return super.getItem(index, CrawlingElement) as CrawlingElement;
    }

    /**
     * Use .map instead if you don't need to change the collection type (default: CrawlingCollection)
     */
    mapElements<NewNativeType>(
        mapCb: (element: EnsuredSuccess<CrawlingElement, Element>) => CrawlingBase<NewNativeType>,
        collectionCtor: CrawlingCollectionClassConstructor<CrawlingCollection<NewNativeType>, NewNativeType> = CrawlingCollection<NewNativeType>
    ): CrawlingCollection<NewNativeType> {
        return super.map<NewNativeType>(mapCb as (element: EnsuredSuccess<CrawlingBase<Element>, Element>) => CrawlingBase<NewNativeType>, CrawlingElement, collectionCtor);
    }
}
