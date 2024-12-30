import { CrawlingBase, CrawlingCollection, CrawlingContext } from "./base";
import { CrawlingText } from "./text";

export class CrawlingElement extends CrawlingBase {
    private _element: Element;

    constructor(element: Element, context: CrawlingContext) {
        super(context);

        this._element = element;
    }

    getTextContent() {
        if (!this._element.textContent) throw this.getError('text content not found')

        return new CrawlingText(this._element.textContent, this._context);
    }

    geNativeTextContent() {
        return this._element.textContent;
    }

    getNextElementSibiling() {
        const next = this._element.nextElementSibling;
        if (!next) throw this.getError('sibiling not found');

        return new CrawlingElement(next, this._context);
    }
}

/**
 * Enforced to always have at least one value
 */
export class CrawlingElements extends CrawlingCollection<CrawlingElement> {
    constructor(elements: CrawlingElement[], context: CrawlingContext) {
        super(elements, context);

        if (elements.length === 0) throw this.getError(`returned zero elements`)

        this._collection = elements;
        this._context = context;
    }

    static getBySelector(selectorPath: string, contentContext?: string) {
        const elements = document.querySelectorAll(selectorPath);
        const newContext = { selectorPath, content: contentContext }

        return new CrawlingElements(
            Array.from(elements).map(element => new CrawlingElement(element, newContext)),
            newContext
        );
    }

    findByTextContent(regExp: RegExp) {
        const foundElement = this._collection.find(element => element.geNativeTextContent()?.match(regExp))

        if (!foundElement) throw this.getError(`nothing found by text content "${regExp}"`)

        return foundElement;
    }
}
