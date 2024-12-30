import { groupBy } from 'lodash';

import { CrawlingElements } from './crawling/dom';
import { BRANDS_DATA, LENS_BRANDS_ALLOWLIST, LensBrand } from './data/lens-brands';
import { LENS_MOUNT_ALLOWLIST, LensMount, SENSOR_COVERAGE_ALLOWLIST, SensorCoverage } from './data/optics';
import { keyedListToSortedAllowlist } from './data/data';

interface MountSensorOption {
    lensMount: LensMount;
    sensorCoverage: SensorCoverage;
}

type FocalLength = { type: 'prime'; length: number } | { type: 'zoom'; minLength: number, maxLength: number }

type ApertureLimit = number | [number, number]

interface LensOpticalDescription {
    brand: LensBrand;
    line: string;
    mountSensorOptions: MountSensorOption[];
    focalLength: FocalLength;
    minimumAperture: ApertureLimit;
    maximumAperture: ApertureLimit;
    minimumFocusDistanceCM: number,
    AF: boolean,
    OIS: boolean,
    // TODO: Evaluate if we need the folowing data
    // macro: boolean,
    // cine: boolean
    // anamorphic: boolean,
    // fisheye: boolean,
    // tiltshift: boolean,
    filterSize: number,
    weightGR: number,
}

interface StoreItemDescription {
    currentPrice: number;
    fullPrice: number;
    buyingLink: string;
}

type LensDescription = LensOpticalDescription & StoreItemDescription;

function crawlLensDescription(): LensDescription {
    const brand: LensBrand = CrawlingElements
        .getBySelector('[data-selenium=productTitle]', 'brand')
        .getFirst()
        .getTextContent()
        .extractWithAllowlist(LENS_BRANDS_ALLOWLIST)
        .toText();

    const line = CrawlingElements
        .getBySelector('[data-selenium=productTitle]', 'line')
        .getFirst()
        .getTextContent()
        .subtractLiterals([brand])
        .extractWithAllowlist(keyedListToSortedAllowlist(BRANDS_DATA[brand].lines))
        .toText();

    const sensorCoverage = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'sensorCoverage')
        .findByTextContent(/^Lens Format Coverage$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithAllowlist(SENSOR_COVERAGE_ALLOWLIST)
        .toText();

    const lensMount = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'lensMount')
        .findByTextContent(/^Lens Mount$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithAllowlist(LENS_MOUNT_ALLOWLIST)
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

    const minimumAperture = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'minimumAperture')
        .findByTextContent(/^Minimum Aperture$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithRegExp(/^f\/(\d+(?:\.\d+)?)$/gm, 1) // Sample: f/22
        .toNumber();

    const maximumAperture = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'maximumAperture')
        .findByTextContent(/^Maximum Aperture$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithRegExp(/^f\/(\d+(?:\.\d+)?)$/gm, 1) // Sample: f/2.8
        .toNumber();

    const minimumFocusDistanceCM = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'minimumFocusDistanceCM')
        .findByTextContent(/^Minimum Focus Distance$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithRegExp(/\/ (\d+(?:\.\d+)?)\scm$/gm, 1) // Sample: 11.02" / 28 cm
        .toNumber();

    const AF = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'AF')
        .findByTextContent(/^Focus Type$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .matchesRegExp(/Autofocus/gm)

    const OIS = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'OIS')
        .findByTextContent(/^Image Stabilization$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .matchesRegExp(/Yes/gm)

    const filterSize = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'filterSize')
        .findByTextContent(/^Filter Size$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithRegExp(/^(\d+(?:\.\d+)?) mm/gm, 1) // Sample: 82 mm (Front)
        .toNumber();

    const weightGR = CrawlingElements
        .getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'weightGR')
        .findByTextContent(/^Weight$/gm)
        .getNextElementSibiling()
        .getTextContent()
        .extractWithRegExp(/\/ (\d+(?:\.\d+)?)\s\g$/gm, 1) // Sample: 1.25 lb / 570 g
        .toNumber();

    const currentPrice = CrawlingElements
        .getBySelector('[data-selenium=pricingPrice]', 'currentPrice')
        .getFirst()
        .getTextContent()
        .extractWithRegExp(/^\$(\d+(?:\.\d+)?)$/gm, 1) // Sample: $300.00
        .toNumber();

    const fullPrice = CrawlingElements
        .getBySelector('[data-selenium=strikeThroughPrice]', 'fullPrice')
        .getFirst()
        .getTextContent()
        .extractWithRegExp(/\$(\d+(?:\.\d+)?)$/gm, 1) // Sample: Price $300.00
        .toNumber();

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

function getFocalLengthDescriptor(lensDescription: LensDescription) {
    function getTailDescriptor() {
        let tailDescriptor = lensDescription.AF ? 'AF' : 'MF';
        if (lensDescription.OIS) {
            tailDescriptor += ' OIS';
        }
        return tailDescriptor;
    }

    if (lensDescription.focalLength.type === 'prime') {
        return `${lensDescription.focalLength.length}mm ${getTailDescriptor()}`;
    }

    return `${lensDescription.focalLength.minLength}-${lensDescription.focalLength.maxLength}mm ${getTailDescriptor()}`;
}

function getApertureDescriptor(apertureLimit: ApertureLimit) {
    if (typeof apertureLimit === 'number') {
        return `f/${apertureLimit}`;
    }

    return `f/${apertureLimit[0]} - f/${apertureLimit[1]}`;
}

function convertToTableDiff(expectedResult: string, givenResult: string) {
    const expectedArray = expectedResult.split('\t');
    const givenArray = givenResult.split('\t');

    const diffTable: [string, string | undefined][] = [];

    expectedArray.forEach((descriptor, index) => {
        if (descriptor !== givenArray[index]) {
            diffTable.push([descriptor, givenArray[index]])
        }
    })

    return diffTable;
}

function getTabbedDescription() {
    const lensDescription = crawlLensDescription();

    const resultArray = [
        lensDescription.brand,
        lensDescription.line,
        getMountSensorOptionsDescriptor(lensDescription.mountSensorOptions),
        getFocalLengthDescriptor(lensDescription),
        getApertureDescriptor(lensDescription.maximumAperture),
        getApertureDescriptor(lensDescription.minimumAperture),
        lensDescription.minimumFocusDistanceCM,
        lensDescription.filterSize,
        lensDescription.weightGR,
        lensDescription.currentPrice,
        lensDescription.fullPrice,
        undefined, // This link is probably going to be added manually
        lensDescription.buyingLink,
    ];

    const result = resultArray.join('\t');
    const expectedResult = `Tokina\tatx-i\tAPS-C (EF)\t11-20mm AF\tf/2.8\tf/22\t28\t82\t570\t399\t529\t\thttps://www.bhphotovideo.com/c/product/1571174-REG/tokina_atx_i_af120cfc_atx_i_11_20mm_f_2_8_cf.html`;

    if (result === expectedResult) {
        console.log('SUCCESS');
        return;
    }

    console.table(convertToTableDiff(expectedResult, result));
}

getTabbedDescription();