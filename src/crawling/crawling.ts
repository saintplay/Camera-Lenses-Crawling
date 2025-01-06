import { LensDescription } from "../types";
import { BAndHPhotoVideoCrawler } from "./pages/BAndHPhotoVideoCrawler";
import { PageCrawler } from "./pages/PageCrawler";

export const CRAWLABLE_SITES: [RegExp, PageCrawler][] = [
	[/(?:www)?\.?bhphotovideo\.com/, new BAndHPhotoVideoCrawler()]
]

// TODO: This merged/multiple description logic should be in the popup code
export function crawlLensDescription(): Partial<LensDescription> {
    const matchedSites = CRAWLABLE_SITES.filter(([regExpSite]) => regExpSite.test(window.location.hostname))

    const capturedLensDescriptions = matchedSites.map(([, pageCrawler]) => pageCrawler.crawlLensDescription())

    // TODO: merge desriptions
    const finalCrawledDescription = capturedLensDescriptions[0];


    // Log errors in the site side
    Object.values(finalCrawledDescription).forEach((property) => {
        if (!property.success) {
            console.error(property.error)
        }
    })
    
    return Object.fromEntries(Object.entries(finalCrawledDescription)
        .map(([property, crawl]) => [property, crawl.success ? crawl.value : undefined]))
}
