import { keyedListToSortedAllowlist } from "../../data/data";
import { BRANDS_DATA, LENS_BRANDS_ALLOWLIST, LensBrand } from "../../data/lens-brands";
import { ApertureLimit, CrawleableLensDescription, FocalLength } from "../../types";
import { CrawlingBase, CrawlingCollection } from "../models/CrawlingBase";
import { CrawlingElements } from "../models/CrawlingDom";
import { CrawlingText } from "../models/CrawlingText";
import { PageCrawler } from "./PageCrawler";

export class FujifilmCrawler extends PageCrawler {
	crawlLensDescription(): Promise<CrawleableLensDescription> {
		const brand = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'brand')
			.findByTextContent(/^Type$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithAllowlist(LENS_BRANDS_ALLOWLIST)
			// We can safely default to fuji, since we are on the fuji page
			.ifError<LensBrand>('Fujifilm', (v) => v._property.value)

		const linesAllowlist = CrawlingBase
			.make<[LensBrand]>([brand])
			(([brand]) => {
				return keyedListToSortedAllowlist(BRANDS_DATA[brand._property.value].lines)
			})

		const line = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'line')
			.findByTextContent(/^Type$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.subtractLiterals(brand.toCollection() as CrawlingCollection<string>)
			.extractWithAllowlist(linesAllowlist)

		const focalLength = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'focalLength')
			.findByTextContent(/^Focal length/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithMultipleRegExp([
				// Sample: f=30mm(46mm)
				[/^f=(\d+)mm/gm, [1]],
				// Sample: f=16-50mm\n (35mm Equivalent: 17.6 to 32mm)
				// Sample: f=55 - 200mm (84-305mm in 35mm format equivalent)
				[/^f=(\d+)\s?-\s?(\d+)mm/gm, [1, 2]]
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
			.getBySelector('.elementor-shortcode table td.column-1', 'minimumAperture')
			.findByTextContent(/^Min. aperture$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithMultipleRegExp([
				// Sample: F22
				[/^F(\d+(?:\.\d+)?)$/gm, [1]],
				// Sample: F16-F22
				[/^F(\d+(?:\.\d+)?)\s?-\s?F(\d+(?:\.\d+)?)$/gm, [1, 2]]
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
			.getBySelector('.elementor-shortcode table td.column-1', 'maximumAperture')
			.findByTextContent(/^Max. aperture$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithMultipleRegExp([
				// Sample: F2.8
				[/^F(\d+(?:\.\d+)?)$/gm, [1]],
				// Sample: F2.8-F4.8
				// Sample: F3.5 - F4.8
				// Sample: F3.5 - 5.6
				[/^F(\d+(?:\.\d+)?)\s?-\s?F?(\d+(?:\.\d+)?)$/gm, [1, 2]]
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

		const minimumFocusDistanceOption1 = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'minimumFocusDistanceCM1')
			.findByTextContent(/^Minimum focus distance/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: 0.1m
			.extractWithRegExp(/^(\d+(?:\.\d+)?m)$/gm, 1)
			.toDistance()
			.toCentimetersValue()

		const minimumFocusDistanceOption2 = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'minimumFocusDistanceCM2')
			.findByTextContent(/^Focus range$/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: 30cm-∞
			// Sample: 70cm - ∞
			// Sample: 0.6m - ∞
			// Sample: 13cm - ∞ (Wide\n35cm - ∞ (Telephoto)
			.extractWithRegExp(/^(\d+(?:\.\d+)?c?m)\s?-\s?∞$/gm, 1)
			.toDistance()
			.toCentimetersValue()

		const minimumFocusDistanceOption3 = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'minimumFocusDistanceCM3')
			.findByTextContent(/^Focus range$/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: 13cm - ∞ (Wide\n35cm - ∞ (Telephoto)
			.extractWithRegExp(/^(\d+(?:\.\d+)?c?m)\s?-\s?∞ \(Wide\)?$/gm, 1)
			.toDistance()
			.toCentimetersValue()

		const minimumFocusDistanceOption4 = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-2', 'minimumFocusDistanceCM4')
			.findByTextContent(/^Macro$/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: 26.7cm - 2.0m
			// Sample: 1m - 3m (whole zoom position)
			.extractWithRegExp(/^(\d+(?:\.\d+)?c?m)\s?-\s?/gm, 1)
			.toDistance()
			.toCentimetersValue()

		const minimumFocusDistanceCM = CrawlingElements
			.useFirst([minimumFocusDistanceOption1, minimumFocusDistanceOption2, minimumFocusDistanceOption3, minimumFocusDistanceOption4])

		const ois = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'ois')
			.findByTextContent(/^Type$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithRegExp(/\b(OIS)\b/gm, 1)
			.ifError(false, () => true)

		const macro = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'macro')
			.findByTextContent(/^Type$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithRegExp(/\b(Macro)\b/gm, 1)
			.ifError(false, () => true)

		const filterSize = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'filterSize')
			.findByTextContent(/^Filter size$/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: Ø43mm
			// Sample: ø46mm
			.extractWithRegExp(/^Ø(\d+(?:\.\d+)?)mm/gmi, 1)
			.toNumber();

		const weightGR = CrawlingElements
			.getBySelector('.elementor-shortcode table td.column-1', 'weightGR')
			.findByTextContent(/^Weight/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample: 195g
			.extractWithRegExp(/(\d+(?:\.\d+)?)\g$/gm, 1)
			.toNumber();

		return Promise.resolve({
			brand,
			line,
			//mountSensorOptions, // Does not appear on fuji spec page.
			focalLength,
			minimumAperture,
			maximumAperture,
			minimumFocusDistanceCM,
			//AF: af, // Does not appear on fuji spec page, but they should all be AF
			OIS: ois,
			macro,
			filterSize,
			weightGR,
			//currentPrice, // Does not appear on fuji spec page.
			//fullPrice, // Does not appear on fuji spec page.
			productLink: CrawlingBase._baseCreateWithValue(window.location.href, {}),
		})
	}
}