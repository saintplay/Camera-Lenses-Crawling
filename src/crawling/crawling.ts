import { LensDescription } from "../types";
import { AmazonCrawler } from "./pages/AmazonCrawler";
import { BAndHPhotoVideoCrawler } from "./pages/BAndHPhotoVideoCrawler";
import { FujifilmCrawler } from "./pages/FujifilmCrawler";
import { MeikeCrawler } from "./pages/MeikeCrawler";
import { SamyangCrawler } from "./pages/SamyangCrawler";
import { PageCrawler } from "./pages/PageCrawler";

export const CRAWLABLE_SITES: [RegExp, PageCrawler][] = [
    [/(?:www)?\.?amazon\.com/, new AmazonCrawler()],
    [/(?:www)?\.?bhphotovideo\.com/, new BAndHPhotoVideoCrawler()],
    [/(?:www)?\.?fujifilm-x\.com/, new FujifilmCrawler()],
    [/(?:www)?\.?meikeglobal\.com/, new MeikeCrawler()],
    [/(?:www)?\.?samyangus\.com/, new SamyangCrawler()],
]

// TODO: This merged/multiple description logic should be in the popup code
export async function crawlLensDescription(): Promise<LensDescription> {
    const matchedSite = CRAWLABLE_SITES.find(([regExpSite]) => regExpSite.test(window.location.hostname))

    if (!matchedSite) {
        throw new Error(`No page matched for ${window.location.hostname}`);
    }
    
    const [, pageCrawler] = matchedSite;

    const capturedLensDescription = await pageCrawler.crawlLensDescription()

    // Log errors in the site side
    Object.values(capturedLensDescription).forEach((descriptor) => {
        if (!descriptor._property.success) {
            console.error(descriptor.getErrorMessage())
        }
    })

    return Object.fromEntries(Object.entries(capturedLensDescription)
        .map(([property, crawl]) => [property, crawl ? (crawl._property.success ? crawl._property.value : undefined) : undefined]))
}
