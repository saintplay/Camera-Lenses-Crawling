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

export interface CrawlingBaseClassConstructor<CrawlingClass extends CrawlingBase<NativeType>, NativeType> {
	new(property: CrawleableProperty<NativeType>, context: CrawlingContext): CrawlingClass;
}

export interface CrawlingCollectionClassConstructor<CrawlingClass extends CrawlingCollection<NativeType>, NativeType> {
	new(property: CrawleableProperty<NativeType[]>, context: CrawlingContext): CrawlingClass;
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

	static useFirst<ItemType>(
		crawlingEntities: CrawlingBase<ItemType>[],
		ctor: CrawlingBaseClassConstructor<CrawlingBase<ItemType>, ItemType> = CrawlingBase<ItemType>,
	): CrawlingBase<ItemType> {
		const mergedContext = this.getMergedContexts(crawlingEntities.map(c => c._context));

		if (crawlingEntities.length == 0) {
			return CrawlingBase._baseCreateWithError<ItemType>('trying to useFirst with no elements', mergedContext, ctor)
		}

		for (const crawl of crawlingEntities) {
			if (crawl._property.success) {
				return crawl;
			}
		}

		return CrawlingBase._baseCreateWithError<ItemType>('trying to useFirst, but no successful crawl provided', mergedContext, ctor)
	}

	static unionByValue<ItemType, T extends CrawlingCollection<ItemType> = CrawlingCollection<ItemType>>(...crawlingEntities: T[]): T {
		const finalCollection: ItemType[] = [];

		for (const collection of crawlingEntities) {
			if (!collection._property.success) {
				return CrawlingCollection._baseCreateWithError(collection._property.error, collection._context) as T;
			}

			for (const item of collection._property.value) {
				// TODO: Implement object comparisson
				if (!finalCollection.find(i => i === item)) {
					finalCollection.push(item)
				}
			}
		}

		const mergedContext = CrawlingBase.getMergedContexts(crawlingEntities.map(collection => collection._context));

		return CrawlingCollection.baseCreateWithValue(finalCollection, mergedContext) as T;
	}

	/**
	 * 
	 * Trying to infer return type from parameter didn't work
	 */
	static _baseCreateWithValue<PropertyType>
		(value: PropertyType, context: CrawlingContext, ctor: CrawlingBaseClassConstructor<CrawlingBase<PropertyType>, PropertyType> = CrawlingBase<PropertyType>) {
		return new ctor({ success: true, value }, context)
	}

	/**
	 * 
	 * Trying to infer return type from parameter didn't work
	 */
	static _baseCreateWithError<PropertyType>
		(error: string, context: CrawlingContext, ctor: CrawlingBaseClassConstructor<CrawlingBase<PropertyType>, PropertyType> = CrawlingBase<PropertyType>) {
		return new ctor({ success: false, error }, context)
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

	/** Use with care as it's going to silent error */
	ifError<ReturnType>(
		ifErrorValue: ReturnType,
		elseErrorValue: (crawlingObject: EnsuredSuccess<this, NativeType>) => ReturnType,
		ctor: CrawlingBaseClassConstructor<CrawlingBase<ReturnType>, ReturnType> = CrawlingBase<ReturnType>,
	) {
		if (!this._property.success) {
			return CrawlingBase._baseCreateWithValue<ReturnType>(ifErrorValue, this._context, ctor);
		}

		return CrawlingBase._baseCreateWithValue<ReturnType>(elseErrorValue(this as EnsuredSuccess<this, NativeType>), this._context, ctor);
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

	to<ReturnType>(
		makeCb: (crawlingObject: EnsuredSuccess<this, NativeType>) => ReturnType,
	): CrawlingBase<ReturnType> {
		if (this.hadError()) {
			return new CrawlingBase<ReturnType>(this._property, this._context);
		}

		return CrawlingBase._baseCreateWithValue(makeCb(this as EnsuredSuccess<this, NativeType>), this._context);
	}

	getErrorMessage() {
		if (this._property.success) return "";

		let finalMessage = this._property.error;

		if (this._context.content) finalMessage += `\n Context: ${this._context.content}`;
		if (this._context.selectorPath) finalMessage += `\n Selector: ${this._context.selectorPath}`;

		return finalMessage;
	}
}

export class CrawlingCollection<ItemType> extends CrawlingBase<ItemType[]> {
	constructor(property: CrawleableProperty<ItemType[]>, context: CrawlingContext) {
		super(property, context);
	}

	getFirst(ctor: CrawlingBaseClassConstructor<CrawlingBase<ItemType>, ItemType> = CrawlingBase<ItemType>) {
		return this.getItem(0, ctor);
	}

	getItem(index: number, ctor: CrawlingBaseClassConstructor<CrawlingBase<ItemType>, ItemType> = CrawlingBase<ItemType>) {
		if (!this._property.success) return CrawlingBase._baseCreateWithError(this._property.error, this._context, ctor);

		if (typeof this._property.value[index] === 'undefined') return CrawlingBase._baseCreateWithError(`element at index "${index}" does not exists`, this._context, ctor);

		return CrawlingBase._baseCreateWithValue<ItemType>(this._property.value[index], this._context, ctor);
	}

	/**
	 * Use .mapElements instead if you need to change the collection type (default: CrawlingCollection)
	 */
	map<NewNativeType>(
		mapCb: (element: EnsuredSuccess<CrawlingBase<ItemType>, ItemType>) => CrawlingBase<NewNativeType>,
		elementCtor: CrawlingBaseClassConstructor<CrawlingBase<ItemType>, ItemType> = CrawlingBase<ItemType>,
		collectionCtor: CrawlingCollectionClassConstructor<CrawlingCollection<NewNativeType>, NewNativeType> = CrawlingCollection<NewNativeType>
	): CrawlingCollection<NewNativeType> {
		if (!this._property.success) return CrawlingCollection.baseCreateWithError<NewNativeType[]>(this._property.error, this._context) as CrawlingCollection<NewNativeType>;

		const crawlArray = this._property.value.map(
			(element) => mapCb(CrawlingBase._baseCreateWithValue(element, this._context, elementCtor) as EnsuredSuccess<CrawlingBase<ItemType>, ItemType>))

		for (const crawl of crawlArray) {
			if (!crawl._property.success) {
				return CrawlingCollection.baseCreateWithError<NewNativeType[]>(crawl._property.error, CrawlingBase.getMergedContexts([this._context, crawl._context])) as CrawlingCollection<NewNativeType>;
			}
		}

		return CrawlingCollection._baseCreateWithValue<NewNativeType[]>(crawlArray.map(crawl => (crawl as EnsuredSuccess<typeof crawl, NewNativeType>)._property.value), this._context, collectionCtor) as CrawlingCollection<NewNativeType>;
	}

	/**
	 * Use .mapElements instead if you need to change the collection type (default: CrawlingCollection)
	 */
	filter(
		filterCb: (element: EnsuredSuccess<CrawlingBase<ItemType>, ItemType>) => boolean,
		collectionCtor: CrawlingCollectionClassConstructor<CrawlingCollection<ItemType>, ItemType> = CrawlingCollection<ItemType>
	) {
		if (!this._property.success) return CrawlingCollection._baseCreateWithError<ItemType[]>(this._property.error, this._context, collectionCtor) as CrawlingCollection<ItemType>;

		const filteredArray = this._property.value.filter(
			(element) => filterCb(CrawlingBase._baseCreateWithValue(element, this._context) as EnsuredSuccess<CrawlingBase<ItemType>, ItemType>))

		return CrawlingCollection._baseCreateWithValue<ItemType[]>(filteredArray, this._context, collectionCtor) as CrawlingCollection<ItemType>;
	}
}