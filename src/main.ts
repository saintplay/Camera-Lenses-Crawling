import { Optional } from 'utility-types';
import { groupBy } from 'lodash';

import { CrawlingElements } from './crawling/dom';
import { BRANDS_DATA, LENS_BRANDS_ALLOWLIST, LensBrand } from './data/lens-brands';
import { LENS_MOUNT_ALLOWLIST, SENSOR_COVERAGE_ALLOWLIST, SensorCoverage } from './data/optics';
import { keyedListToSortedAllowlist } from './data/data';
import { ApertureLimit, FocalLength, LensDescription, MountSensorOption } from '.';

interface CrawlingOptions {
    disableFailFast: {
        weightGR?: boolean;
        currentPrice?: boolean;
        sensorCoverage?: boolean;
        OIS?: boolean;
        minimumAperture?: boolean;
    }
}

const CRAWLING_OPTIONS: CrawlingOptions = {
    disableFailFast: {}
}

type ReachableLensDescription = Optional<
    LensDescription,
    'weightGR' | 'currentPrice' | 'fullPrice' | 'OIS' | 'minimumAperture' | 'line'
>

function crawlLensDescription(): ReachableLensDescription {
    const brand: LensBrand = CrawlingElements
        .getBySelector('[data-selenium=productTitle]', 'brand')
        .getFirst()
        .getTextContent()
        .subtractLiterals(['for fujifilm', '(fujifilm'])
        .extractWithAllowlist(LENS_BRANDS_ALLOWLIST)
        .toText();

    let line: string | undefined
    try {
        line = CrawlingElements
            .getBySelector('[data-selenium=productTitle]', 'line')
            .getFirst()
            .getTextContent()
            .subtractLiterals([brand])
            .extractWithAllowlist(keyedListToSortedAllowlist(BRANDS_DATA[brand].lines))
            .toText();
    } catch (error) {
        // TODO: Handle somehow.
        // TODO: If line is not found, we need at most a warning. If there in an error with the logic, then console.error 
        console.error(error)
    }

    // TODO: Capture in from bullet point as well: https://www.bhphotovideo.com/c/product/1675607-REG/voigtlander_ba350d_color_skopar_21mm_f_3_5_aspherical.html
    let sensorCoverage: SensorCoverage | undefined
    try {
        sensorCoverage = CrawlingElements
            .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'sensorCoverage')
            .findByTextContent(/^Lens Format Coverage$/gm)
            .getNextElementSibiling()
            .getTextContent()
            .extractWithAllowlist(SENSOR_COVERAGE_ALLOWLIST)
            .toText();
    } catch (error) {
        if (!CRAWLING_OPTIONS.disableFailFast?.sensorCoverage) throw error;
    }

    const lensMount = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'lensMount')
        .findByTextContent(/^Lens Mount$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithAllowlist(LENS_MOUNT_ALLOWLIST, true)
        .toText();

    const mountSensorOptions: MountSensorOption[] = [{ sensorCoverage, lensMount }];

    const focalLength = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'focalLength')
        .findByTextContent(/^Focal Length$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithMultipleRegExp([
            // Sample: 24mm
            // Sample: 75mm (35mm Equivalent: 112.5mm)
            [/^(\d+)mm/gm, [1]],
            // Sample: 11 to 20mm (35mm Equivalent: 17.6 to 32mm)
            // Sample: 28 to 70mm
            [/^(\d+) to (\d+)mm/gm, [1, 2]]
        ])
        .ifElse(
            textContents => textContents.getLength() == 2,
            (textContents): FocalLength => {
                const [minFocalTC, maxTextContentTC] = textContents.asArray();
                return {
                    type: 'zoom',
                    minLength: minFocalTC.toNumber(),
                    maxLength: maxTextContentTC.toNumber()
                }
            },
            (textContents): FocalLength => {
                const [focalTC] = textContents.asArray();
                return {
                    type: 'prime',
                    length: focalTC.toNumber()
                }
            },
        )

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

function getMountSensorOptionsDescriptor(mountSensorOptions: MountSensorOption[]) {
    return Object.entries(
        groupBy(
            mountSensorOptions,
            (option) => option.sensorCoverage
        )).map(
            ([sensorCoverage, mOptions]) =>
                `${sensorCoverage} (${mOptions.map((opt) => opt.lensMount
                ).join(', ')})`
        ).join(' ');
}

function getMinFocalLength(focalLength: FocalLength) {
    if (focalLength.type === 'prime') {
        return focalLength.length
    }

    return focalLength.minLength
}

function getMaxFocalLength(focalLength: FocalLength) {
    if (focalLength.type === 'prime') {
        return focalLength.length
    }

    return focalLength.maxLength
}

function getFocalDescriptor(lensDescription: ReachableLensDescription) {
    let tailDescriptor = lensDescription.AF ? 'AF' : 'MF';
    if (lensDescription.OIS) {
        tailDescriptor += ' OIS';
    }
    return tailDescriptor;
}

function getApertureDescriptor(apertureLimit: ApertureLimit) {
    if (typeof apertureLimit === 'number') {
        return `f/${apertureLimit}`;
    }

    return `f/${apertureLimit[0]} - f/${apertureLimit[1]}`;
}

function getTabbedDescription() {
    const lensDescription = crawlLensDescription();

    const resultArray = [
        lensDescription.brand,
        lensDescription.line,
        getMountSensorOptionsDescriptor(lensDescription.mountSensorOptions),
        getMinFocalLength(lensDescription.focalLength),
        getMaxFocalLength(lensDescription.focalLength),
        getFocalDescriptor(lensDescription),
        getApertureDescriptor(lensDescription.maximumAperture),
        lensDescription.minimumAperture ? getApertureDescriptor(lensDescription.minimumAperture) : undefined,
        lensDescription.minimumFocusDistanceCM,
        lensDescription.filterSize,
        lensDescription.weightGR,
        lensDescription.currentPrice,
        lensDescription.fullPrice,
        lensDescription.buyingLink,
    ];

    return resultArray.join('\t');
}

chrome.runtime.onMessage.addListener(
    (message, _: chrome.runtime.MessageSender, __: () => void): undefined => {
        const { type } = message;

        if (type === "OPTION_CHANGED") {
            const { option, field, value }: { option: string; field: string; value: boolean } = message;

            if (option === "DISABLE_FAIL_FAST") {
                CRAWLING_OPTIONS.disableFailFast[field as keyof CrawlingOptions['disableFailFast']] = value
            }

        }

        else if (type === "CRAWL_REQUEST") {
            try {
                const result = getTabbedDescription();

                console.log("Lens Specs Info Crawled");
                console.log(result);

                // Send results to popup
                chrome.runtime.sendMessage({ type: "CRAWL_RESULTS_SUCCESS", data: result })

                // Assert Results with simple sample
                //const expectedResult = `Tokina\tatx-i\tAPS-C (EF)\t11-20mm AF\tf/2.8\tf/22\t28\t82\t570\t399\t529\t\thttps://www.bhphotovideo.com/c/product/1571174-REG/tokina_atx_i_af120cfc_atx_i_11_20mm_f_2_8_cf.html`;
                //if (result === expectedResult) {
                //console.log('SUCCESS');
                //    return;
                //}

                //function convertToTableDiff(expectedResult: string, givenResult: string) {
                //    const expectedArray = expectedResult.split('\t');
                //    const givenArray = givenResult.split('\t');

                //    const diffTable: [string, string | undefined][] = [];

                //    expectedArray.forEach((descriptor, index) => {
                //        if (descriptor !== givenArray[index]) {
                //            diffTable.push([descriptor, givenArray[index]])
                //        }
                //    })

                //    return diffTable;
                //}

                //console.table(convertToTableDiff(expectedResult, result));
            } catch (error) {
                // Send error to popup
                chrome.runtime.sendMessage({ type: "CRAWL_RESULTS_ERROR", data: String(error) })
            }
        }
    }

)
