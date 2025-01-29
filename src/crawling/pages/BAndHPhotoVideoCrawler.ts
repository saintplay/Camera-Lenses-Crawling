import { isInAllowlist, keyedListToSortedAllowlist } from "../../data/data";
import { BRANDS_DATA, LENS_BRANDS_ALLOWLIST, LensBrand } from "../../data/lens-brands";
import { SEEKING_LENS_MOUNT_ALLOWLIST, SeekingLensMount, SENSOR_COVERAGE_ALLOWLIST, SensorCoverage } from "../../data/optics";
import { ApertureLimit, CrawleableLensDescription, FocalLength, MountSensorOption } from "../../types";
import { CrawlingBase } from "../models/CrawlingBase";
import { CrawlingElements } from "../models/CrawlingDom";
import { CrawlingText, CrawlingTexts } from "../models/CrawlingText";
import { PageCrawler } from "./PageCrawler";

export class BAndHPhotoVideoCrawler extends PageCrawler {
	crawlLensDescription(): Promise<CrawleableLensDescription> {
		const brand = CrawlingElements
			.getBySelector('[data-selenium=productTitle]', 'brand')
			.getFirst()
			.getTextContent()
			.extractWithRegExp(/^(.+?)\s/gm, 1)
			.extractWithAllowlist(LENS_BRANDS_ALLOWLIST)

		const linesAllowlist = CrawlingBase
			.make<[LensBrand]>([brand])
			(([brand]) => {
				return keyedListToSortedAllowlist(BRANDS_DATA[brand._property.value].lines)
			});
		
		const line = CrawlingElements
			.getBySelector('[data-selenium=productTitle]', 'line')
			.getFirst()
			.getTextContent()
			.subtractLiterals(brand.toCollection())
			.extractWithAllowlist(linesAllowlist)

		const tableSensorCoverage = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'table sensorCoverage')
			.findByTextContent(/^Lens Format Coverage$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithAllowlist(SENSOR_COVERAGE_ALLOWLIST)

		const bulletPointSensorCoverage = CrawlingElements
			.getBySelector('[data-selenium=sellingPointsListItem]', 'bulletPointSensorCoverage')
			.getFirst()
			.getTextContent()
			.extractWithAllowlist(SENSOR_COVERAGE_ALLOWLIST)

		const sensorCoverage = CrawlingBase
			// Bullet point has the priority
			.useFirst([bulletPointSensorCoverage, tableSensorCoverage, ]);

		const tableLensMount = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'lensMount')
			.findByTextContent(/^Lens Mount$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithAllowlist(SEEKING_LENS_MOUNT_ALLOWLIST, 'exact')

		const availableLensMounts = (((CrawlingElements
			.getBySelector('[data-selenium=itemOptionsGroupHeader]', 'other lens mounts')
			.findByTextContent(/^(?:Lens )?Mount$/gm)
			.getParent()
			.getBySelector('[data-selenium=optionsGroupingName]')
			.ifError<Element[]>([], (crawl) => crawl._property.value, CrawlingElements) as CrawlingElements)
			.mapElements<string>((element) => element.getTextContent(), CrawlingTexts) as CrawlingTexts)
			.filter((text) => isInAllowlist(SEEKING_LENS_MOUNT_ALLOWLIST, text._property.value, 'exact'), CrawlingTexts) as CrawlingTexts)
			.map<SeekingLensMount>((mountCandidate) => mountCandidate.extractWithAllowlist(SEEKING_LENS_MOUNT_ALLOWLIST, 'exact'))
		
		const allLensMounts = CrawlingBase
			.unionByValue<SeekingLensMount>(tableLensMount.toCollection(), availableLensMounts)
		// TODO: sort to get the same order
		//.sortByValue()

		const mountSensorOptions = CrawlingBase
			.make<[SensorCoverage, SeekingLensMount[]]>([sensorCoverage, allLensMounts])
			(([coverage, mounts]): MountSensorOption[] => mounts._property.value.map(
				(mount) => ({ sensorCoverage: coverage._property.value, lensMount: mount })
			))

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
			.map<number>((textContent) => CrawlingText.createFromBase(textContent).toNumber())
			.ifElse<FocalLength>(
				textContents => textContents._property.value.length == 2,
				(textContents) => {
					const [minLength, maxLength] = textContents._property.value

					return {
						type: 'zoom',
						minLength,
						maxLength,
					}
				},
				(textContents) => {
					const [focalLength] = textContents._property.value

					return {
						type: 'prime',
						length: focalLength
					}
				},
			)

		const minimumAperture = CrawlingElements
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
			.map<number>((textContent) => CrawlingText.createFromBase(textContent).toNumber())
			.ifElse<ApertureLimit>(
				textContents => textContents._property.value.length === 2,
				(textContents) => {
					const [lowerAperture, upperAperture] = textContents._property.value;
					return [lowerAperture, upperAperture]
				},
				(textContents) => {
					const [aperture] = textContents._property.value;
					return aperture;
				},
			)

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
			.map<number>((textContent) => CrawlingText.createFromBase(textContent).toNumber())
			.ifElse<ApertureLimit>(
				textContents => textContents._property.value.length === 2,
				(textContents): ApertureLimit => {
					const [lowerAperture, upperAperture] = textContents._property.value;
					return [lowerAperture, upperAperture]
				},
				(textContents): ApertureLimit => {
					const [aperture] = textContents._property.value;
					return aperture;
				},
			)

		const minimumFocusDistanceCM = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'minimumFocusDistanceCM')
			.findByTextContent(/^Minimum Focus Distance$/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: 11.8" / 0.3 m
			// Sample: 11.02" / 28 cm
			.extractWithRegExp(/\/ (\d+(?:\.\d+)?\s[cm]?m)$/gm, 1)
			.toDistance()
			.toCentimetersValue()

		const af = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'AF')
			.findByTextContent(/^Focus Type$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.matchesRegExp(/Autofocus/gm)

		const ois = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'OIS')
			.findByTextContent(/^Image Stabilization$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.matchesRegExp(/Yes/gm)

		const macro = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'Macro')
			.findByTextContent(/^Macro Reproduction Ratio$/gm)
			.ifError(false, () => true)

		const filterSize = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'filterSize')
			.findByTextContent(/^Filter Size$/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: 82 mm (Front)
			// Sample: 35.5 mm (Front)
			.extractWithRegExp(/^(\d+(?:\.\d+)?) mm/gm, 1)
			.toNumber();

		const weightGR = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'weightGR')
			.findByTextContent(/^Weight$/gm)
			.getNextElementSibiling()
			.getTextContent()
			 // Sample: 1.25 lb / 570 g
			 // Sample: 2.93 lb / 1.33 kg
			.extractWithRegExp(/\/ (\d+(?:\.\d+)?\sk?\g)$/gm, 1)
			.toWeight()
			.toGrams();

		const currentPrice = CrawlingElements
			.getBySelector('[data-selenium=pricingPrice]', 'currentPrice')
			.getFirst()
			.getTextContent()
			.subtractLiterals([','])
			// Sample: USD$374.00
			// Sample: $300.00
			// Sample: USD$1,119.95
			.extractWithRegExp(/\$(\d+(?:\.\d+)?)$/gm, 1)
			.toNumber();

		const fullPrice = CrawlingElements
			.getBySelector('[data-selenium=strikeThroughPrice]', 'fullPrice')
			.getFirst()
			.getTextContent()
			.subtractLiterals([','])
			// Sample: Price USD $1,299.00
			// Sample: Price $300.00
			.extractWithRegExp(/\$(\d+(?:\.\d+)?)$/gm, 1)
			.toNumber();

		return Promise.resolve({
			brand,
			line,
			mountSensorOptions,
			focalLength,
			minimumAperture,
			maximumAperture,
			minimumFocusDistanceCM,
			AF: af,
			OIS: ois,
			macro,
			filterSize,
			weightGR,
			currentPrice,
			fullPrice,
			bhPhotoVideoLink: CrawlingBase._baseCreateWithValue(window.location.href, {}),
		})

	}
}