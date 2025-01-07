<script setup lang="ts">
import { ref, onMounted, useTemplateRef, computed, reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid';

import { listenToEvents, sendMessageToAllTabs, sendMessageToCurrentTab } from '../../events';
import { BasicLensIdentifier, getBasicLensIdentifier, isIncomplete, LensDescription, mergeLensDescriptions } from '../../types';
import { getTabbedDescription } from '../data-tranform';

const errorMessage = ref<string | null>(null)
const lensDesriptionResult = ref<LensDescription | null>(null)
const mergeErrors = reactive<{ field: string, values: string[] }[]>([])

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

const tabbedResults = computed(() => lensDesriptionResult.value ? getTabbedDescription(lensDesriptionResult.value):  null)

onMounted(() => {
	listenToEvents((event) => {
		const { type } = event;

		if (type === "CRAWL_RESPONSE") {
			if (event.success) {
				const { lensDesription, requestId } = event
                lensDesriptionResult.value = lensDesription;
                errorMessage.value = null;
                mergeErrors.length = 0;

				if (isIncomplete(lensDesription)) {
					// Request more information from other tabs
					sendMessageToAllTabs({ type: "MORE_CRAWL", lensIdentifier: getBasicLensIdentifier(lensDesription) as BasicLensIdentifier, requestId })
				}
			} else {
				const { error } = event

                lensDesriptionResult.value = null;
                errorMessage.value = error;
                mergeErrors.length = 0;
			}

		}
		else if (type === "MORE_CRAWL_RESPONSE") {
			if (event.success) {
				const { mergeErrors, lensDescription: newLensDescription } = mergeLensDescriptions(lensDesriptionResult.value as LensDescription, event.lensDesription)

 				lensDesriptionResult.value = newLensDescription;
				mergeErrors.length = 0;
				mergeErrors.push(...mergeErrors);
			} else {
				const { error } = event

				// TODO: Handle this
				console.error(error)
			}
		}
	})
})
</script>

<template>
	<h1>Lens Spec Crawler</h1>
	<div style="padding: 12px">
		<button @click="crawlSpecs">Get Specs</button>

		<div v-show="lensDesriptionResult" style="margin-top: 12px 0;">
			<h3 style="margin-bottom: 8px;">Results</h3>

            <table v-if="lensDesriptionResult">
                <tbody>
                    <tr v-for="(value, property) in lensDesriptionResult">
                        <td style="font-weight: bold;">{{  property }}</td>
                        <td>{{ value }}</td>
                    </tr>
                </tbody>
            </table>
            
			<pre ref="tabbed-result-pre">{{tabbedResults }}</pre>

			<div style="margin-top: 6px 0;">
				<button @click="copyResults">Copy</button>
			</div>

			<div v-if="mergeErrors.length > 0" style="margin-top: 6px 0;">
				<h3 style="margin-bottom: 8px;">Merge Errors</h3>

				<table>
                <tbody>
                    <tr v-for="error in mergeErrors">
                        <td style="font-weight: bold;">{{  error.field }}</td>
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
