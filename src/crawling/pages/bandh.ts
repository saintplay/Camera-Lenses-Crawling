import { LENS_BRANDS_ALLOWLIST } from "../../data/lens-brands";
import { CrawlingElements } from "../dom";

// TODO: Move crawling logic from main.ts here
export class BAndHCrawler {
	constructor() {

	}

	crawlLensDescription() {
		return {
			brand: {
				crawl: () => CrawlingElements
						.getBySelector('[data-selenium=productTitle]', 'brand')
						.getFirst()
						.getTextContent()
						.extractWithAllowlist(LENS_BRANDS_ALLOWLIST)
						.toText()
			},
			line: {}
		}
	}
}