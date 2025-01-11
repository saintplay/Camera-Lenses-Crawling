<script setup lang="ts">
import { ref, onMounted, useTemplateRef, computed, reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid';

import { listenToEvents, sendMessageToAllTabs, sendMessageToCurrentTab } from '../../events';
import { BasicLensIdentifier, getBasicLensIdentifier, isIncomplete, LensDescription, mergeLensDescriptions, MergeValues, ProducWithLinks } from '../../types';
import { getTabbedDescription } from '../data-tranform';

const errorMessage = ref<string | null>(null)
const lensDesriptionResult = ref<LensDescription | null>(null)

const mergeValues = reactive<MergeValues>([])

const tabbedResultPre = useTemplateRef('tabbed-result-pre');

function crawlSpecs() {
	const newRequestId = uuidv4();
	sendMessageToCurrentTab({ type: "CRAWL_REQUEST", newRequestId });
}

function copyResults() {
	if (tabbedResultPre.value) {
		window.getSelection()?.selectAllChildren(tabbedResultPre.value);
	}
	document.execCommand("copy");
}

const missingProperties = computed(() => Object.entries(EXPECTED_FIELDS).filter(([property]) => lensDesriptionResult.value && typeof lensDesriptionResult.value[property] === 'undefined').map(([property]) => property))

const tabbedResults = computed(() => lensDesriptionResult.value ? getTabbedDescription(lensDesriptionResult.value) : null)

const multiValueMerges = computed(() => mergeValues.filter(merge => merge.values.length > 1))

onMounted(() => {
	listenToEvents((event) => {
		const { type } = event;

		if (type === "CRAWL_RESPONSE") {
			if (event.success) {
				const { lensDesription, requestId } = event
				lensDesriptionResult.value = lensDesription;
				errorMessage.value = null;
				mergeValues.length = 0;

				if (isIncomplete(lensDesription)) {
					// Request more information from other tabs
					sendMessageToAllTabs({ type: "MORE_CRAWL", lensIdentifier: getBasicLensIdentifier(lensDesription) as BasicLensIdentifier, requestId })
				}
			} else {
				const { error } = event
				errorMessage.value = error;
			}

		}
		else if (type === "MORE_CRAWL_RESPONSE") {
			if (event.success) {
				const { mergeValues: newMergeValues, lensDescription: newLensDescription } = mergeLensDescriptions(mergeValues, lensDesriptionResult.value as LensDescription, event.lensDesription)

				lensDesriptionResult.value = newLensDescription;
				mergeValues.length = 0;
				mergeValues.push(...newMergeValues)
			} else {
				const { error } = event

				// TODO: Handle this
				console.error(error)
			}
		}
	})
})

type ExpectedLensDescriptionKeys = Exclude<keyof LensDescription, keyof ProducWithLinks> | keyof Pick<ProducWithLinks, 'productLink'>;

const EXPECTED_FIELDS: { [prop in ExpectedLensDescriptionKeys]: true } = {
	brand: true,
	focalLength: true,
	maximumAperture: true,
	line: true,
	mountSensorOptions: true,
	minimumAperture: true,
	minimumFocusDistanceCM: true,
	AF: true,
	OIS: true,
	macro: true,
	filterSize: true,
	weightGR: true,
	currentPrice: true,
	fullPrice: true,
	productLink: true,
}

</script>

<template>
	<h1>Lens Spec Crawler</h1>
	<div style="padding: 12px">
		<button @click="crawlSpecs">Get Specs</button>

		<div v-show="lensDesriptionResult" style="margin-top: 12px 0;">
			<div v-if="missingProperties.length > 0">
				<h3 style="margin-bottom: 8px;">Missing properties</h3>

				<ul>
					<li v-for="property in missingProperties">
						<td style="font-weight: bold; color: red;">{{ property }}</td>
					</li>
				</ul>
			</div>

			<pre ref="tabbed-result-pre">{{ tabbedResults }}</pre>

			<div style="margin-top: 6px 0;">
				<button @click="copyResults">Copy</button>
			</div>

			<div v-if="multiValueMerges.length > 0" style="margin-top: 6px 0;">
				<h3 style="margin-bottom: 8px;">Merge Errors</h3>

				<table>
					<tbody>
						<tr v-for="error in multiValueMerges">
							<td style="font-weight: bold;">{{ error.field }}</td>
							<td v-for="value in error.values">{{ value }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div v-show="errorMessage" style="margin-top: 12px 0;">
			<h3 style="margin-bottom: 8px;">Error</h3>
			<pre>{{ errorMessage }}</pre>
		</div>
	</div>
</template>
