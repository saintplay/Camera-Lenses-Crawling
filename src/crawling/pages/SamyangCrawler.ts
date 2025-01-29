import { getAllowlistItem, keyedListToSortedAllowlist } from "../../data/data";
import { BRANDS_DATA, LensBrand } from "../../data/lens-brands";
import { SEEKING_LENS_MOUNT_ALLOWLIST, SENSOR_COVERAGE_ALLOWLIST } from "../../data/optics";
import { ApertureLimit, CrawleableLensDescription, FocalLength, MountSensorOption } from "../../types";
import { CrawlingBase, CrawlingCollection } from "../models/CrawlingBase";
import { CrawlingElements } from "../models/CrawlingDom";
import { CrawlingText, CrawlingTexts } from "../models/CrawlingText";
import { PageCrawler } from "./PageCrawler";

export class SamyangCrawler extends PageCrawler {
	crawlLensDescription(): Promise<CrawleableLensDescription> {
		const brand = CrawlingBase._baseCreateWithValue<LensBrand>('Samyang', {})

		const linesAllowlist = CrawlingBase
			.make<[LensBrand]>([brand])
			(([brand]) => {
				return keyedListToSortedAllowlist(BRANDS_DATA[brand._property.value].lines)
			})

		const line = CrawlingElements
			.getBySelector('h1.product-single__title', 'line')
			.getFirst()
			.getTextContent()
			.subtractLiterals(brand.toCollection() as CrawlingCollection<string>)
			.extractWithAllowlist(linesAllowlist)

		const optionsDescriptionsElements = CrawlingElements.getBySelector('.product-block--tab .collapsible-content', 'sensorOptions')

		const focalLength = optionsDescriptionsElements
			.getFirst()
			.getBySelector('p')
			// Sample: Focal Length: 24mm
			.findByTextContent(/^Focal Length:/gm)
			.getTextContent()
			.extractWithRegExp(/^Focal Length:\s*(\d+)mm$/gm, 1)
			.toNumber()
			.to<FocalLength>((focalLength) => ({ type: 'prime', length: focalLength._property.value }))

		const apertureRange = optionsDescriptionsElements
			.getFirst()
			.getBySelector('p')
			// Sample: Aperture Range: F1.4 to F22
			// Sample: Aperture Range: F1.2-16
			// Sample: Aperture Range: T1.5 to T22
			.findByTextContent(/^Aperture Range:/gm)
			.getTextContent()
			.extractWithRegExp(/^Aperture Range:\s*[FT](\d+(?:\.\d+)?)\s*(?:to|-)\s*[FT]?(\d+(?:\.\d+)?)$/gm, [1, 2])
			.map<number>((textContent) => CrawlingText.createFromBase(textContent).toNumber())
			.map<ApertureLimit>((aperture) => CrawlingBase._baseCreateWithValue<ApertureLimit>(aperture._property.value, aperture._context))

		const maximumAperture1 = optionsDescriptionsElements
			.getFirst()
			.getBySelector('p')
			// Sample: Maximum Aperture: F1.4
			.findByTextContent(/^Maximum Aperture:/gm)
			.getTextContent()
			.extractWithRegExp(/^Maximum Aperture:\s*F(\d+(?:\.\d+)?)$/gm, 1)
			.toNumber()
			.to<ApertureLimit>(aperture => aperture._property.value)

		const maximumAperture2 = apertureRange.getItem(0)

		const maximumAperture = CrawlingBase.useFirst<ApertureLimit>([maximumAperture1, maximumAperture2])

		const minimumAperture = apertureRange.getItem(1)

		const mountCandidates = (CrawlingElements
			.getBySelector('.product-block--tab button')
			.mapElements<string>((element) => element.getTextContent(), CrawlingTexts) as CrawlingTexts)
			.mapTexts<string>((text) => text.subtractLiterals(['with Automatic Chip', 'with AE']), CrawlingTexts) as CrawlingTexts

		const sensorCandidates = (optionsDescriptionsElements
			.mapElements<string>((element) => element
				.getBySelector('p')
				.findByTextContent(/^Coverage:/gm)
				.getTextContent()
				, CrawlingTexts) as CrawlingTexts)

		const mountSensorOptions = CrawlingBase
			.make<[string[], string[]]>([mountCandidates, sensorCandidates])
			(([mountCandidates, sensorCandidates]): MountSensorOption[] => mountCandidates
				._property.value
				.map((mount, index) => [mount, sensorCandidates._property.value[index]])
				.map(([mount, sensor]) => [getAllowlistItem(SEEKING_LENS_MOUNT_ALLOWLIST, mount, 'exact-trimmed'), getAllowlistItem(SENSOR_COVERAGE_ALLOWLIST, sensor, 'word-constrained')])
				.filter(([mount, sensor]) => mount && sensor)
				// Filter out duplicates
				.filter(([mount], index, arr) => arr.findIndex(el => el[0] === mount) === index)
				.map(([mount, sensor]) => ({ lensMount: mount?.name, sensorCoverage: sensor?.name }) as MountSensorOption)
			)

		const minimumFocusDistanceCM = optionsDescriptionsElements
			.getFirst()
			.getBySelector('p')
			// Sample: Minimum Focusing Distance: 2.26' (0.69m)
			// Sample: Minimum Focusing Distance: 9.8” (0.25m)
			// Sample: Minimum Focusing Distance: 13.4" (0.34m)
			// Sample: Minimum Focusing Distance: 2.95ft (0.90m)
			.findByTextContent(/^Minimum Focusing Distance:/gm)
			.getTextContent()
			.extractWithRegExp(/^Minimum Focusing Distance:\s*.+(?:'|”|"|ft)\s*\((\d+(?:\.\d+)?m)\)$/gm, 1)
			.toDistance()
			.toCentimetersValue()

		const af = CrawlingElements
			.getBySelector('h1.product-single__title', 'af')
			.getFirst()
			.getTextContent()
			.matchesRegExp(/\bAF\b/gmi)

		const macro = CrawlingElements
			.getBySelector('h1.product-single__title', 'macro')
			.getFirst()
			.getTextContent()
			.matchesRegExp(/\bMacro\b/gmi)

		const filterSize = optionsDescriptionsElements
			.getFirst()
			.getBySelector('p')
			// Sample: Filter Size: 77mm
			.findByTextContent(/^Filter Size:/gm)
			.getTextContent()
			.extractWithRegExp(/^Filter Size:\s*(\d+(?:\.\d+)?)mm$/gmi, 1)
			.toNumber();

		const weightGR = optionsDescriptionsElements
			.getFirst()
			.getBySelector('p')
			// Sample: Weight: 20.5oz (580g)
			// Sample: Weight: 39oz (1,106g)
			.findByTextContent(/^Weight:/gm)
			.getTextContent()
			.subtractLiterals([','])
			.extractWithRegExp(/^Weight:\s*.+oz\s*\((\d+(?:\.\d+)?g)\)$/gmi, 1)
			.toWeight()
			.toGrams();

		const currentPrice = CrawlingElements
			.getBySelector('span[data-product-price]', 'currentPrice')
			.getFirst()
			.getTextContent()
			// Sample: $494.95
			.extractWithRegExp(/^\$(\d+(?:\.\d+)?)$/gm, 1)
			.toNumber();

		const fullPrice = CrawlingElements
			.getBySelector('span[data-compare-price]', 'fullPrice')
			.getFirst()
			.getTextContent()
			// Sample: $999.00
			.extractWithRegExp(/^\$(\d+(?:\.\d+)?)$/gm, 1)
			.toNumber();

		return Promise.resolve({
			brand,
			line,
			mountSensorOptions, // Does not seem to appear.
			focalLength,
			minimumAperture,
			maximumAperture,
			minimumFocusDistanceCM,
			AF: af,
			//OIS, // It seems that there are no lenses with OIS
			macro,
			filterSize,
			weightGR,
			currentPrice, // Does not appear on fuji spec page.
			fullPrice, // Does not seem to appear.
			productLink: CrawlingBase._baseCreateWithValue(window.location.href, {}),
		})
	}
}