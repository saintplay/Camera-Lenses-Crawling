import { isInAllowlist } from "../../data/data";
import { LENS_BRANDS_ALLOWLIST, LensBrand } from "../../data/lens-brands";
import { SEEKING_LENS_MOUNT_ALLOWLIST, SeekingLensMount, SENSOR_COVERAGE_ALLOWLIST, SensorCoverage } from "../../data/optics";
import { ApertureLimit, CrawleableLensDescription, FocalLength, MountSensorOption } from "../../types";
import { CrawlingBase } from "../models/CrawlingBase";
import { CrawlingBoolean } from "../models/CrawlingBoolean";
import { CrawlingElement, CrawlingElements } from "../models/CrawlingDom";
import { CrawlingText, CrawlingTexts } from "../models/CrawlingText";
import { PageCrawler } from "./PageCrawler";

export class MeikeCrawler extends PageCrawler {
	async crawlLensDescription(): Promise<CrawleableLensDescription> {
		const brand = CrawlingElements
			.getBySelector('h1.product-title', 'brand')
			.getFirst()
			.getTextContent()
			.extractWithRegExp(/^\s+(Meike)/gmi, 1)
			.extractWithAllowlist(LENS_BRANDS_ALLOWLIST)
			// We can safely default to Meike, since we are on the Meike page
			.ifError<LensBrand>('Meike', (v) => v._property.value)

		const imageTableEl1 = CrawlingElements
			.getBySelector('.product-description h2', 'imageTableEl1')
			.findByTextContent(/^\s*Technical Sheet\s*$/gmi)
			.getNextElementSibiling()
			.getBySelector('img')
			.getFirst()

		const imageTableEl2 = CrawlingElements
			.getBySelector('.product-description img[data-mce-fragment="1"]', 'imageTableEl2')
			.getFirst()

		const imageTable = CrawlingBase
			.useFirst([imageTableEl1, imageTableEl2], CrawlingElement) as CrawlingElement

		const descriptionTextsFromImage = await CrawlingTexts.fromTableImage(imageTable)

		const descriptionTextsFromBody = CrawlingElements
			.getBySelector('.product-description')
			.getFirst()
			.getAllTextNodesAsText()

		// This is redundant with `descriptionTextsFromBody` but it helps to get desriptions that combine spans with text nodes
		const descriptionTextsFromList = (CrawlingElements
			.getBySelector('.product-description ul li')
			.mapElements<string>((element) => element.getTextContent(), CrawlingTexts)) as CrawlingTexts

		const descriptionTexts = CrawlingTexts.concatTextSuccessfulls([descriptionTextsFromImage, descriptionTextsFromBody, descriptionTextsFromList]);

		const focalLength1 = CrawlingElements
			.getBySelector('.product-description table td', 'focalLength1')
			// Sample: Focal length: 35mm
			.findByTextContent(/^Focal Length:\s*$/gm)
			.getNextElementSibiling()
			.getTextContent()

		const focalLength2 = CrawlingElements
			.getBySelector('h1.product-title', 'focalLength2')
			.getFirst()
			.getTextContent()
			.extractWithRegExp(/\b(\d+mm)\b/gmi, 1)

		const focalLength3 = descriptionTexts
			// Sample: Focal Length: 50mm
			// Sample: Focus focal lengths: 50mm 
			.findByRegExp(/^(?:Focus )?Focal lengths?:?/gmi)
			.extractWithRegExp(/^(?:Focus )?Focal lengths?:?\s*(.+?)\s*$/gmi, 1)

		const focalLength = (CrawlingBase
			.useFirst([focalLength1, focalLength2, focalLength3], CrawlingText) as CrawlingText)
			// Sample: 50mm
			.extractWithRegExp(/^(\d+)mm$/gm, 1)
			.toNumber()
			.to<FocalLength>((length) => ({ 'type': "prime", length: length._property.value }))

		const apertureRange1 = CrawlingElements
			.getBySelector('.product-description table td', 'apertureRange1')
			.findByTextContent(/^Aperture Range:\s*$/gm)
			.getNextElementSibiling()
			.getTextContent()

		const apertureRange2 = descriptionTexts
			//  Sample: Aperture scale: f/1.7-f/22
			//  Sample: Aperture range F1.2- F22
			//  Sample: Aperture range: F1.8-22
			//  Sample: Aperture Range: f/1.7-f/22, Large Aperture f/1.7
			.findByRegExp(/^Aperture (?:scale|range):?\s+.+/gmi)
			.extractWithRegExp(/^Aperture (?:scale|range):?\s+(.+?)(?:,.*)?$/gmi, 1)

		const apertureRange = (CrawlingBase
			.useFirst([apertureRange1, apertureRange2], CrawlingText) as CrawlingText)

		const minimumAperture1 = apertureRange
			// Sample: F0.95-F16
			// Sample: f/1.7-f/22
			// Sample: F1.8-22
			.extractWithRegExp(/^F\/?(\d+(?:\.\d+)?)\s?-\s?F?\/?(\d+(?:\.\d+)?)$/gmi, 2)
			.toNumber()
			.to<ApertureLimit>((textContent) => textContent._property.value)

		const minimumAperture2 = descriptionTexts
			// Sample: Minimum Aperture: f/16
			// Sample: Minimun Aperture:  f/22,
			.findByRegExp(/^Minimu[mn]\sAperture:?/gmi)
			// Sample: f/16
			.extractWithRegExp(/^Minimu[mn]\sAperture:?\s*F?\/?(\d+(?:\.\d+)?)/gmi, 1)
			.toNumber()
			.to<ApertureLimit>((textContent) => textContent._property.value)

		const minimumAperture = CrawlingBase.useFirst([minimumAperture1, minimumAperture2])

		const maximumAperture1 = apertureRange
			// Sample: F0.95-F16
			// Sample: f/1.7-f/22
			.extractWithRegExp(/^F\/?(\d+(?:\.\d+)?)\s?-\s?F?\/?(\d+(?:\.\d+)?)$/gmi, 1)
			.toNumber()
			.to<ApertureLimit>((textContent) => textContent._property.value)

		const maximumAperture2 = descriptionTexts
			// Sample: Maximum Aperture: f/1.4
			.findByRegExp(/^Maximu[mn]\sAperture:?/gmi)
			// Sample: f/1.4
			.extractWithRegExp(/^Maximu[mn]\sAperture:?\s*F?\/?(\d+(?:\.\d+)?)/gmi, 1)
			.toNumber()
			.to<ApertureLimit>((textContent) => textContent._property.value)

		const maximumAperture = CrawlingBase.useFirst([maximumAperture1, maximumAperture2])

		const sensorCoverage1 = CrawlingElements
			.getBySelector('h1.product-title', 'sensorCoverage1')
			.getFirst()
			.getTextContent()
			.extractWithAllowlist(SENSOR_COVERAGE_ALLOWLIST, 'word-constrained')

		const sensorCoverage2 = descriptionTexts
			// Sample: Format Full Frame
			.findByRegExp(/^\s*Format:?\s*/gmi)
			// Sample: f/1.4
			.extractWithRegExp(/^\s*Format:?\s*(.+)$/gmi, 1)
			.extractWithAllowlist(SENSOR_COVERAGE_ALLOWLIST, 'word-constrained')

		const sensorCoverage = CrawlingBase.useFirst([sensorCoverage1, sensorCoverage2])

		const availableLensMounts = ((CrawlingElements
			.getBySelector('span.options-selection__option-value-name', 'availableLensMounts')
			.mapElements<string>(
				(element) => element
					.getTextContent()
					// Sample: 35mm F0.95 E mount
					// Sample: 35mm F1.4 APS-C for X Mount
					.subtractLiterals(['MF-']) // Prefix used by Meike for full frames
					.extractWithRegExp(/([\w-]+)\b\s+Mount\b/gmi, 1),
				CrawlingTexts
			) as CrawlingTexts)
			.filter((text) => isInAllowlist(SEEKING_LENS_MOUNT_ALLOWLIST, text._property.value, 'exact'), CrawlingTexts) as CrawlingTexts)
			.map<SeekingLensMount>((text) => text.extractWithAllowlist(SEEKING_LENS_MOUNT_ALLOWLIST, 'exact'))

		const mountSensorOptions = CrawlingBase
			.make<[SensorCoverage, SeekingLensMount[]]>([sensorCoverage, availableLensMounts])
			(([coverage, mounts]): MountSensorOption[] => mounts._property.value.map(
				(mount) => ({ sensorCoverage: coverage._property.value, lensMount: mount })
			));

		const minimumFocusDistanceCM1 = CrawlingElements
			.getBySelector('.product-description table td', 'minimumFocusDistanceCM')
			.findByTextContent(/^Min Focal Dist:\s*$/gm)
			.getNextElementSibiling()
			.getTextContent()

		const minimumFocusDistanceCM2 = descriptionTexts
			//  Sample: Minimun Focus Distance:0.6m
			//  Sample: Minimum focusing distance: 0.175m
			.findByRegExp(/^Minimu[mn] Focus(?:ing)? Distance:?/gmi)
			.extractWithRegExp(/^Minimu[mn] Focus(?:ing)? Distance:?\s*(.+)$/gmi, 1)

		const minimumFocusDistanceCM = (CrawlingBase
			.useFirst([minimumFocusDistanceCM1, minimumFocusDistanceCM2], CrawlingText) as CrawlingText)
			// Sample: 45cm
			// Sample: 0.39m
			// Sample: 0.4m 1.31ft
			.extractWithRegExp(/^(\d+(?:\.\d+)?c?m)/gm, 1)
			.toDistance()
			.toCentimetersValue()

		const af = CrawlingElements
			.getBySelector('h1.product-title', 'af')
			.getFirst()
			.getTextContent()
			.matchesRegExp(/\bAuto\s?Focus\b/gmi)

		const macro = CrawlingElements
			.getBySelector('h1.product-title', 'macro')
			.getFirst()
			.getTextContent()
			.matchesRegExp(/\bAuto\s?Focus\b/gmi)

		const filterSize1 = CrawlingElements
			.getBySelector('.product-description table td', 'filterSize1')
			.findByTextContent(/^Filter Thread:\s*$/gm)
			.getNextElementSibiling()
			.getTextContent()

		const filterSize2 = descriptionTexts
			// Sample: Filter Size:67mm
			// Sample: Filter Size Ф52mm
			// Sample: Filter diameter: 49mm
			// Sample: Filter thread: 49mm
			// Sample: Filter Thread Size: 55mm
			.findByRegExp(/^Filter (?:Size|diameter|thread)\s*(?:size)?:?/gmi)
			.extractWithRegExp(/^Filter (?:Size|diameter|thread)\s*(?:size)?:?\s*(.+)$/gmi, 1)

		const filterSize = (CrawlingBase
			.useFirst([filterSize1, filterSize2], CrawlingText) as CrawlingText)
			// Sample: Ф 52mm
			// Sample: ø62
			// Sample: 67mm
			.extractWithRegExp(/^[Ф|ø]?\s?(\d+(?:\.\d+)?)(?:mm)?/gmi, 1)
			.toNumber()

		const weightGR1 = CrawlingElements
			.getBySelector('.product-description table td', 'weightGR1')
			.findByTextContent(/^Weight:\s*$/gm)
			.getNextElementSibiling()
			.getTextContent()

		const weightGR2 = descriptionTexts
			// Sample: Product Weight:620g
			// Sample: Weight: 176g
			// Sample: Weight: about 286g
			.findByRegExp(/^(?:Product )?Weight:?\s*(?:about)?\s*\d+/gm)
			.extractWithRegExp(/^(?:Product )?Weight:?\s*(?:about)?\s*(.+)$/gm, 1)

		const weightGR = (CrawlingBase
			.useFirst([weightGR1, weightGR2], CrawlingText) as CrawlingText)
			// Sample: 380g （0.838lb）
			// Sample: 620g
			.extractWithRegExp(/(\d+(?:\.\d+)?)g/gm, 1)
			.toNumber()

		const currentPriceEl1 = CrawlingElements
			.getBySelector('.product-pricing .price__current--on-sale .cbb-price-currency-USD .cbb-price-digits', 'fullPrice')
			.getFirst()
			.getTextContent()

		const currentPriceEl2 = CrawlingElements
			.getBySelector('.product-pricing .price__current .cbb-price-currency-USD .cbb-price-digits', 'fullPrice')
			.getFirst()
			.getTextContent()

		const currentPrice = (CrawlingBase.useFirst([currentPriceEl1, currentPriceEl2], CrawlingText) as CrawlingText)
			// Sample: 208.00
			.extractWithRegExp(/^(\d+(?:\.\d+)?)$/gm, 1)
			.toNumber();

		const fullPrice = CrawlingElements
			.getBySelector('.product-pricing .price__compare-at.visible .cbb-price-currency-USD .cbb-price-digits', 'currentPrice')
			.getFirst()
			.getTextContent()
			// Sample: 259.00
			.extractWithRegExp(/^(\d+(?:\.\d+)?)$/gm, 1)
			.toNumber();

		return Promise.resolve({
			brand,
			line: CrawlingText._baseCreateWithValue('', {}), // No lines available fron Meike brand
			mountSensorOptions,
			focalLength,
			minimumAperture,
			maximumAperture,
			minimumFocusDistanceCM,
			AF: af,
			OIS: CrawlingBoolean._baseCreateWithValue(false, {}), // No lens from meike has ois
			macro,
			filterSize,
			weightGR,
			currentPrice,
			fullPrice,
			productLink: CrawlingBase._baseCreateWithValue(window.location.href, {}),
		})
	}
}
