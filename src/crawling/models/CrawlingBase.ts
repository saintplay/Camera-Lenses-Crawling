export interface CrawlingContext {
	content?: string;
	selectorPath?: string;
}

export type CrawleablePropertySucess<NativeType> = { success: true; value: NativeType }
export type CrawleablePropertyError = { success: false; error: string }

export type CrawleableProperty<NativeType> = CrawleablePropertySucess<NativeType> | CrawleablePropertyError
export type EnsuredSuccess<CrawlingType, NativeType> = Omit<CrawlingType & CrawlingBase<NativeType, CrawleablePropertySucess<NativeType>>, '_property'> & CrawlingBase<NativeType, CrawleablePropertySucess<NativeType>>;
export type EnsuredError<CrawlingType, NativeType> = Omit<CrawlingType & CrawlingBase<NativeType, CrawleablePropertyError>, '_property'> & CrawlingBase<NativeType, CrawleablePropertyError>;

type MapToCrawling<Arr> = {
	[Property in keyof Arr]: CrawlingBase<Arr[Property]>
};

type MapToSucessCrawling<Arr> = {
	[Property in keyof Arr]: EnsuredSuccess<CrawlingBase<Arr[Property]>, Arr[Property]>
};

interface CrawlingBaseClassConstructor<CrawlingClass extends CrawlingBase<NativeType>, NativeType> {
    new (property: CrawleableProperty<NativeType>, context: CrawlingContext): CrawlingClass;
}

export class CrawlingBase<NativeType, P extends CrawleableProperty<NativeType> = CrawleableProperty<NativeType>> {
	_context: CrawlingContext;
	_property: P;

	constructor(property: P, context: CrawlingContext) {
		this._property = property;
		this._context = context;
	}

	static getMergedContexts(contexts: CrawlingContext[]) {
		type ContextToCheck = Required<CrawlingContext>;
		const baseContext: { [cp in keyof ContextToCheck]: string[] } = {
			content: [],
			selectorPath: [],
		};

		contexts.forEach(context => {
			Object.entries(baseContext).forEach(([property]) => {
				if (context[property]) {
					baseContext[property].push(context[property]);
				}
			})
		})

		const finalContext: CrawlingContext = {}

		Object.entries(baseContext).forEach(([property]) => {
			if (baseContext[property].length) {
				finalContext[property] = baseContext[property].join(' + ');
			}
		})

		return finalContext;
	}

	static make<T extends any[]>(crawlingEntities: [...MapToCrawling<T>]):
		<R>(makeCb: (entities: MapToSucessCrawling<T>) => R) => CrawlingBase<R> {
		for (const entity of crawlingEntities) {
			if (!entity._property.success) {
				const erroredEntity = entity as EnsuredError<T[number], unknown>;

				return () => {
					return this.baseCreateWithError(erroredEntity._property.error, entity._context)
				}
			}
		}

		const mergedContext = this.getMergedContexts(crawlingEntities.map(e => e._context))
		return (makeCb) => {
			return this.baseCreateWithValue(makeCb(crawlingEntities as MapToSucessCrawling<T>), mergedContext);
		}
	}

	static _baseCreateWithValue<PropertyType, C extends CrawlingBase<PropertyType> = CrawlingBase<PropertyType>>
	(value: PropertyType, context: CrawlingContext, ctor: CrawlingBaseClassConstructor<C, PropertyType>) {
		return new ctor({ success: true, value }, context)
	}

	/**
	 * Using the `base` functions and the `not base` should be the same. The not base function is needed to be coded per typescript limitations
	 */
	static baseCreateWithValue<PropertyType>(value: PropertyType, context: CrawlingContext) {
		return new this<PropertyType>({ success: true, value }, context)
	}

	/**
	 * Using the `base` functions and the `not base` should be the same. The not base function is needed to be coded per typescript limitations
	 */
	static baseCreateWithError<PropertyType>(error: string, context: CrawlingContext) {
		return new this<PropertyType>({ success: false, error }, context)
	}

	// Use this to predicate `this` as a whole
	hadSuccess(): this is CrawlingBase<NativeType, CrawleablePropertySucess<NativeType>> {
		return this._property.success;
	}

	// Use this to predicate `this` as a whole
	hadError(): this is CrawlingBase<NativeType, CrawleablePropertyError> {
		return !this._property.success;
	}

	toCollection(): CrawlingCollection<NativeType> {
		if (!this._property.success) {
			return CrawlingCollection.baseCreateWithError(this._property.error, this._context) as CrawlingCollection<NativeType>;
		}

		return CrawlingCollection.baseCreateWithValue([this._property.value], this._context) as CrawlingCollection<NativeType>;
	}

	toResult() {
		return this._property;
	}

	ifElse<ReturnType>(
		predicateFn: (crawlingObject: EnsuredSuccess<this, NativeType>) => boolean,
		trueFn: (crawlingObject: EnsuredSuccess<this, NativeType>) => ReturnType,
		falseFn: (crawlingObject: EnsuredSuccess<this, NativeType>) => ReturnType,
	): CrawlingBase<ReturnType> {
		if (this.hadError()) {
			return new CrawlingBase<ReturnType>(this._property, this._context);
		}

		if (this.hadSuccess()) {
			if (predicateFn(this)) {
				return CrawlingBase.baseCreateWithValue(trueFn(this), this._context);
			} else {
				return CrawlingBase.baseCreateWithValue(falseFn(this), this._context);
			}
		}

		throw new Error('unreachable code')
	}

	getErrorMessage() {
		if (this._property.success) return;

		let finalMessage = this._property.error;

		if (this._context.content) finalMessage += `\n Context: ${this._context.content}`;
		if (this._context.selectorPath) finalMessage += `\n Selector: ${this._context.selectorPath}`;

		return finalMessage;
	}
}


/**
 * Enforced to always have at least one element
 */
export class CrawlingCollection<ItemType> extends CrawlingBase<ItemType[]> {
	protected constructor(property: CrawleableProperty<ItemType[]>, context: CrawlingContext) {
		super(property, context);

		if (property.success && property.value.length === 0) {
			this._property = { success: false, error: 'returned zero elements' }
		}
	}

	getFirst<C extends CrawlingBase<ItemType> = CrawlingBase<ItemType>>(ctor: CrawlingBaseClassConstructor<C, ItemType>): CrawlingBase<ItemType> {
		if (!this._property.success) return CrawlingBase.baseCreateWithError(this._property.error, this._context);

		return CrawlingBase._baseCreateWithValue<ItemType>(this._property.value[0], this._context, ctor);
	}

	getItem(index: number): CrawlingBase<ItemType> {
		if (!this._property.success) return CrawlingBase.baseCreateWithError(this._property.error, this._context);

		if (typeof this._property.value[index] === 'undefined') return CrawlingBase.baseCreateWithError(`element at index "${this._property.value}"`, this._context);

		return CrawlingBase.baseCreateWithValue<ItemType>(this._property.value[index], this._context);
	}

	map<NewNativeType>(mapCb: (element: EnsuredSuccess<CrawlingBase<ItemType>, ItemType>) => CrawlingBase<NewNativeType>): CrawlingCollection<NewNativeType> {
		if (!this._property.success) return CrawlingCollection.baseCreateWithError<NewNativeType[]>(this._property.error, this._context) as CrawlingCollection<NewNativeType>;

		const crawlArray = this._property.value.map(
				(element) => mapCb(CrawlingBase.baseCreateWithValue(element, this._context) as EnsuredSuccess<CrawlingBase<ItemType>, ItemType>))

		for (const crawl of crawlArray) {
			if (!crawl._property.success) {
				return CrawlingCollection.baseCreateWithError<NewNativeType[]>(crawl._property.error, CrawlingBase.getMergedContexts([this._context, crawl._context])) as CrawlingCollection<NewNativeType>;
			}
		}

		return CrawlingCollection.baseCreateWithValue<NewNativeType[]>(crawlArray.map(crawl => (crawl as EnsuredSuccess<typeof crawl, NewNativeType>)._property.value), this._context) as CrawlingCollection<NewNativeType>;
	}
}