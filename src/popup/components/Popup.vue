<script setup lang="ts">
import { ref, onMounted, useTemplateRef, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid';

import { listenToEvents, sendMessageToAllTabs, sendMessageToCurrentTab } from '../../events';
import { BasicLensIdentifier, LensDescription } from '../../types';
import { getTabbedDescription } from '../data-tranform';

const errorMessage = ref("")
const lensDesriptionResult = ref<Partial<LensDescription> | null>(null)

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

				// TODO: Make the check for this
				// If there is lacking information, request more information from other tabs
				sendMessageToAllTabs({ type: "MORE_CRAWL", lensIdentifier: {} as BasicLensIdentifier, requestId })
			} else {
				const { error } = event

                lensDesriptionResult.value = null;
                errorMessage.value = error;
			}

		}
		else if (type === "MORE_CRAWL_RESPONSE") {
			// TODO: Handle this
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
                    <tr v-for="([property, value]) in Object.entries(lensDesriptionResult).filter(([, value]) => typeof value !== 'undefined')">
                        <td style="font-weight: bold;">{{  property }}</td>
                        <td>{{ value }}</td>
                    </tr>
                </tbody>
            </table>
            
			<pre ref="tabbed-result-pre" v-show="false">{{tabbedResults }}</pre>

			<div style="margin-top: 6px 0;">
				<button @click="copyResults">Copy</button>
			</div>
		</div>


		<div v-show="errorMessage" style="margin-top: 12px 0;">
			<h3 style="margin-bottom: 8px;">Error</h3>
			<pre>{{ errorMessage }}</pre>
		</div>
	</div>
</template>
