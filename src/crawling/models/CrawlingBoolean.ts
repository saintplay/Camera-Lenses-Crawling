import { CrawleableProperty, CrawlingBase, CrawlingContext } from "./CrawlingBase";

export class CrawlingBoolean extends CrawlingBase<boolean> {
	protected constructor(property: CrawleableProperty<boolean>, context: CrawlingContext) {
		super(property, context);
	}
}
