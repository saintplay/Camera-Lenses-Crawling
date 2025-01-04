import { AllowListItem, keyedListToSortedAllowlist } from "../../data/data";
import { BRANDS_DATA, LENS_BRANDS_ALLOWLIST, LensBrand } from "../../data/lens-brands";
import { LENS_MOUNT_ALLOWLIST, SENSOR_COVERAGE_ALLOWLIST } from "../../data/optics";
import { CrawleableLensDescription, FocalLength, MountSensorOption } from "../../types";
import { CrawleableProperty, CrawlingBase, CrawlingCollection } from "../models/CrawlingBase";
import { CrawlingElements } from "../models/CrawlingDom";
import { CrawlingText } from "../models/CrawlingText";

// TODO: Move crawling logic from main.ts here
export class BAndHPhotoVideoCrawler extends PageCrawler {
	crawlLensDescription(): CrawleableLensDescription {
		const brand = CrawlingElements
			.getBySelector('[data-selenium=productTitle]', 'brand')
			.getFirst()
			.getTextContent()
			.extractWithAllowlist(LENS_BRANDS_ALLOWLIST)

		const linesAllowlist = CrawlingBase
			.make<[LensBrand]>([brand])
			(([brand]) => {
				return keyedListToSortedAllowlist(BRANDS_DATA[brand._property.value].lines)
			})


		const line = CrawlingElements
			.getBySelector('[data-selenium=productTitle]', 'line')
			.getFirst()
			.getTextContent()
			.subtractLiterals(brand.toCollection())
			.extractWithAllowlist(linesAllowlist) as CrawlingText // BCOMMIT



		const tableSensorCoverage = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'table sensorCoverage')
			.findByTextContent(/^Lens Format Coverage$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithAllowlist(SENSOR_COVERAGE_ALLOWLIST)

		const bulletPointSensorCoverage = CrawlingElements
			.getBySelector('BCOMMIT', 'bullet point sensorCoverage')
			.findByTextContent(/BCOMMIT/)
			.getTextContent()
			.extractWithRegExp(/BCOMMIT/, 1)


		const sensorCoverage = CrawlingBase
			.useFirst([tableSensorCoverage, bulletPointSensorCoverage], { throwIfDifferentValues: true });

		const tableLensMount = CrawlingElements
			.getBySelector('[data-selenium=specsItemGroupTableColumnLabel]', 'lensMount')
			.findByTextContent(/^Lens Mount$/gm)
			.getNextElementSibiling()
			.getTextContent()
			.extractWithAllowlist(LENS_MOUNT_ALLOWLIST, true)

		const otherLensMounts = CrawlingElements
			.getBySelector('BCOMMIT', 'other lens mounts')
			.map<CrawlingText>((element) => element.extractWithAllowlist(LENS_MOUNT_ALLOWLIST, true))

		const mountSensorOptions = CrawlingBase
			.unionByValue([tableLensMount.toCollection(), otherLensMounts])
			.map<CrawleableProperty<MountSensorOption>>((lensMount) => CrawlingObject.create({ sensorCoverage, lensMount }))


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
			.ifElse<FocalLength>(
				textContents => textContents._property.value.length == 2,
				(textContents) => {
					const [minLength, maxLength] = textContents._property.value

					return CrawlingBase.createBcommit<FocalLength>({
						type: 'zoom',
						minLength,
						maxLength,
					}, textContents._context)
				},
				(textContents): FocalLength => {
					const focalLength = textContents.getFirst();
					return {
						type: 'prime',
						length: focalLength.toNumber()
					}
				},
			)

		return {
			brand: brand.toResult(),
			line: line.toResult(),
			mountSensorOptions: mountSensorOptions.toResult(),
			focalLength: focalLength.toResult(),
		}

	}
}