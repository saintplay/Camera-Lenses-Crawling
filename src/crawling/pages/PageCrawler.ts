import { CrawleableLensDescription } from "../../types";

export abstract class PageCrawler {
	abstract crawlLensDescription(): Partial<CrawleableLensDescription>;
}