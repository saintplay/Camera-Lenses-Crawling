import { LensDescription } from "../types";
import { BAndHPhotoVideoCrawler } from "./pages/BAndHPhotoVideoCrawler";
import { FujifilmCrawler } from "./pages/FujifilmCrawler";
import { PageCrawler } from "./pages/PageCrawler";

export const CRAWLABLE_SITES: [RegExp, PageCrawler][] = [
    [/(?:www)?\.?bhphotovideo\.com/, new BAndHPhotoVideoCrawler()],
    [/(?:www)?\.?fujifilm-x\.com/, new FujifilmCrawler()]
]

// TODO: This merged/multiple description logic should be in the popup code
export function crawlLensDescription(): LensDescription {
    const matchedSites = CRAWLABLE_SITES.filter(([regExpSite]) => regExpSite.test(window.location.hostname))

    const capturedLensDescriptions = matchedSites.map(([, pageCrawler]) => pageCrawler.crawlLensDescription())

    // TODO: merge desriptions
    const finalCrawledDescription = capturedLensDescriptions[0];


    // Log errors in the site side
    Object.values(finalCrawledDescription).forEach((descriptor) => {
        if (!descriptor._property.success) {
            console.error(descriptor.getErrorMessage())
        }
    })

    return Object.fromEntries(Object.entries(finalCrawledDescription)
        .map(([property, crawl]) => [property, crawl ? (crawl._property.success ? crawl._property.value : "") : ""]))
}
