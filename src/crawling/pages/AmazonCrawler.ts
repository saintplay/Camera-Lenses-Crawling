import { LENS_BRANDS_ALLOWLIST } from "../../data/lens-brands";
import { ApertureLimit, CrawleableLensDescription, FocalLength } from "../../types";
import { CrawlingBase } from "../models/CrawlingBase";
import { CrawlingElements } from "../models/CrawlingDom";
import { CrawlingText } from "../models/CrawlingText";
import { PageCrawler } from "./PageCrawler";

export class AmazonCrawler extends PageCrawler {
	crawlLensDescription(): Partial<CrawleableLensDescription> {
		const brand = CrawlingElements
			.getBySelector('#productOverview_feature_div table td.a-span3 span', 'brand')
			.findByTextContent(/^Brand$/gm)
			.getParent()
			.getNextElementSibiling()
			.getChild()
			.getTextContent()
			.extractWithAllowlist(LENS_BRANDS_ALLOWLIST)

		const focalLength = CrawlingElements
			.getBySelector('#productOverview_feature_div table td.a-span3 span', 'focalLength')
			.findByTextContent(/^Focal Length Description$/gm)
			.getParent()
			.getNextElementSibiling()
			.getChild()
			.getTextContent()
			.extractWithMultipleRegExp([
				[/^(\d+)\s?(mm|millimeters)/gm, [1]],
				// Sample: 17-28mm
				// Sample: 50-230 millimeters
				[/^(\d+)\s?-\s?(\d+)\s?(mm|millimeters)/gm, [1, 2]]
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

		const maximumAperture = CrawlingElements
			.getBySelector('h1#title > span#productTitle', 'maximumAperture')
			.getFirst()
			.getTextContent()
			.extractWithMultipleRegExp([
				// Sample: 230mmF4.5-6.7 OIS
				// Sample: 300mm F/4.5-6.3 Di
				[/mm\s?F\/?(\d+(?:\.\d+)?)\s?-\s?(\d+(?:\.\d+)?)\b/gmi, [1, 2]],
				// Sample: 23mm F1.4 XC
				// Sample: 90mm F/2.8 Di III
				[/mm\s?F\/?(\d+(?:\.\d+)?)\b/gmi, [1]],
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

		const weightGR = CrawlingElements
			.getBySelector('table#productDetails_detailBullets_sections1 th.prodDetSectionEntry', 'weightGR')
			.findByTextContent(/^\s*Item Weight\s*$/gm)
			.getNextElementSibiling()
			.getTextContent()
			// Sample:  13.2 ounces 
			// Sample:  1.1 pounds 
			.extractWithRegExp(/^\s*(\d+(?:\.\d+)?\s?(ounces|pounds))\s*$/gm, 1)
			.toWeight()
			.toGrams();

		return {
			brand,
			focalLength,
			maximumAperture,
			weightGR,
			amazonLink: CrawlingBase._baseCreateWithValue(window.location.href, {}),
		}

	}
}