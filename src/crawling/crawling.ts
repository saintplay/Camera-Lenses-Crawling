import { LensDescription } from "../types";

export const CRAWLABLE_SITES = [
	[/(?:www)?\.?bhphotovideo\.com/, new BHPhotoVideoCrawler()]
]

export function crawlLensDescription(): Partial<LensDescription> {
    

    let minimumAperture: ApertureLimit | undefined;
    try {
        minimumAperture = CrawlingElements
            .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'minimumAperture')
            .findByTextContent(/^Minimum Aperture$/gm)
            .getNextElementSibiling()
            .getTextContent()
            .extractWithMultipleRegExp([
                // Sample: f/22
                [/^f\/(\d+(?:\.\d+)?)$/gm, [1]],
                // Sample: f/22 to 40
                [/^f\/(\d+(?:\.\d+)?)(:? to (\d+(?:\.\d+)?))?$/gm, [1, 3]]
            ])
            .ifElse(
                textContents => textContents.getLength() == 2,
                (textContents): ApertureLimit => {
                    const [lowerAperture, upperAperture] = textContents.asArray();
                    return [lowerAperture.toNumber(), upperAperture.toNumber()]
                },
                (textContents): ApertureLimit => {
                    const [aperture] = textContents.asArray();
                    return aperture.toNumber();
                },
            )
    } catch (error) {
        if (!CRAWLING_OPTIONS.disableFailFast?.minimumAperture) throw error;
    }

    const maximumAperture = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'maximumAperture')
        .findByTextContent(/^Maximum Aperture$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithMultipleRegExp([
            // Sample: f/2.8
            [/^f\/(\d+(?:\.\d+)?)$/gm, [1]],
            // Sample: f/2.8 to 4
            [/^f\/(\d+(?:\.\d+)?)(:? to (\d+(?:\.\d+)?))?$/gm, [1, 3]]
        ])
        .ifElse(
            textContents => textContents.getLength() == 2,
            (textContents): ApertureLimit => {
                const [lowerAperture, upperAperture] = textContents.asArray();
                return [lowerAperture.toNumber(), upperAperture.toNumber()]
            },
            (textContents): ApertureLimit => {
                const [aperture] = textContents.asArray();
                return aperture.toNumber();
            },
        )
    const minimumFocusDistanceCM = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'minimumFocusDistanceCM')
        .findByTextContent(/^Minimum Focus Distance$/gm)
        .getNextElementSibiling()
        .getTextContent()
        // Sample: 11.8" / 0.3 m
        // Sample: 11.02" / 28 cm
        .extractWithRegExp(/\/ (\d+(?:\.\d+)?\s[scm]*)$/gm, 1)
        .toDistance()
        .toCentimetersValue()

    const AF = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'AF')
        .findByTextContent(/^Focus Type$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .matchesRegExp(/Autofocus/gm)

    let OIS: boolean | undefined
    try {
        OIS = CrawlingElements
            .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'OIS')
            .findByTextContent(/^Image Stabilization$/gm)
            .getNextElementSibiling()
            .getTextContent()
            .matchesRegExp(/Yes/gm)
    } catch (error) {
        if (!CRAWLING_OPTIONS.disableFailFast?.OIS) throw error;
    }

    const filterSize = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'filterSize')
        .findByTextContent(/^Filter Size$/gm)
        .getNextElementSibiling()
        .getTextContent()
        // Sample: 82 mm (Front)
        // Sample: 35.5 mm (Front)
        .extractWithRegExp(/^(\d+(?:\.\d+)?) mm/gm, 1)
        .toNumber();

    let weightGR: number | undefined
    try {
        weightGR = CrawlingElements
            .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'weightGR')
            .findByTextContent(/^Weight$/gm)
            .getNextElementSibiling()
            .getTextContent()
            .extractWithRegExp(/\/ (\d+(?:\.\d+)?)\s\g$/gm, 1) // Sample: 1.25 lb / 570 g
            .toNumber();
    } catch (error) {
        if (!CRAWLING_OPTIONS.disableFailFast?.weightGR) throw error;
    }

    let currentPrice: number | undefined;
    try {
        currentPrice = CrawlingElements
            .getBySelector('[data-selenium=pricingPrice]', 'currentPrice')
            .getFirst()
            .getTextContent()
            .subtractLiterals([','])
            // Sample: USD$374.00
            // Sample: $300.00
            // Sample: USD$1,119.95
            .extractWithRegExp(/\$(\d+(?:\.\d+)?)$/gm, 1)
            .toNumber();
    } catch (error) {
        if (!CRAWLING_OPTIONS.disableFailFast?.currentPrice) throw error;
    }

    let fullPrice: number | undefined;
    try {
        fullPrice = CrawlingElements
            .getBySelector('[data-selenium=strikeThroughPrice]', 'fullPrice')
            .getFirst()
            .getTextContent()
            .subtractLiterals([','])
            // Sample: Price USD $1,299.00
            // Sample: Price $300.00
            .extractWithRegExp(/\$(\d+(?:\.\d+)?)$/gm, 1)
            .toNumber();
    } catch {
        // Ignore errors since it fullPrice is not always visible
        // TODO: Better handle this?
        fullPrice = currentPrice
    }

    const buyingLink = window.location.href;

    return {
        brand,
        line,
        mountSensorOptions,
        focalLength,
        minimumAperture,
        maximumAperture,
        minimumFocusDistanceCM,
        AF,
        OIS,
        filterSize,
        weightGR,
        currentPrice,
        fullPrice,
        buyingLink
    };
}

export function crawlLensDescription(): Partial<LensDescription> {
	if (window.location.)
}