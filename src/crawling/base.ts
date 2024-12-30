export interface CrawlingContext {
	content?: string;
	selectorPath?: string;
}

export class CrawlingBase {
    protected _context: CrawlingContext;

	constructor(context: CrawlingContext) {
        this._context = context;
    }
	
	ifElse<T, F>(
		predicateFn: (crawlingObject: this) => boolean,
		trueFn: (crawlingObject: this) => T,
		falseFn: (crawlingObject: this) => F,
	): T | F {
		if (predicateFn(this)) {
			return trueFn(this);
		} else {
			return falseFn(this);
		}
	}

	getError(message: string) {
		return CrawlingBase.getErrorWithContext(message, this._context)
	}

	static getErrorWithContext(message: string, context?: CrawlingContext) {
		let finalMessage = message;

		if (context?.content) finalMessage += `\n Context: ${context.content}`;
		if (context?.selectorPath) finalMessage += `\n Selector: ${context.selectorPath}`;
		
		return finalMessage;
	}
}


/**
 * Enforced to always have at least one element
 */
export class CrawlingCollection<T extends CrawlingBase> extends CrawlingBase {
    protected _collection: T[];

    constructor(collection: T[], context: CrawlingContext) {
        super(context);

        if (collection.length === 0) throw this.getError(`returned zero elements`)

        this._collection = collection;
    }

    getFirst(throwIfMultiple?: boolean) {
        if (throwIfMultiple && this._collection.length > 1) throw this.getError('there are multiple results values')

        return this._collection[0];
    }

	/** Be careful to do data manipulation here */
	asArray() {
		return this._collection;
	}

    getLength() {
        return this._collection.length;
    }
}