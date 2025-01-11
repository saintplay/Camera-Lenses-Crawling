import type { GenerateContentRequest, GenerateContentResponse } from '@google/generative-ai'

import { AITableFromImageMemoizer } from "../cache/AITableFromImageMemoizer";

/** @see https://stackoverflow.com/a/75577501 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/** @see https://gist.github.com/saintplay/4cc46f98d52534941c807572019ad239 */
const arrayBufferToSHA = async (buffer: ArrayBuffer) => {
	const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

const ACCEPTED_SOURCE_TYPES = ['image/png', 'image/jpeg']

export const readTextFromTableImage = async (imagePath: string) => {
	const imageResponse = await fetch(imagePath)

	const sourceType = imageResponse.headers.get('source-type');

	if (!sourceType) {
		throw new Error(`Request for image " ${imagePath} " did not return a header source type`)
	}

	if (!ACCEPTED_SOURCE_TYPES.includes(sourceType)) {
		throw new Error(`Image source type "${sourceType}" is not allowed`)
	}

	const imageArrayBuffer = await imageResponse.arrayBuffer();
	const imageSHA = await arrayBufferToSHA(imageArrayBuffer);

	const cachedResult = await AITableFromImageMemoizer.get(imageSHA);

	// Consult cache before querying
	if (cachedResult) {
		console.log(`Retrieveng cached result for sha: "${imageSHA}"`)
		return cachedResult;
	}

	const fetchResponse = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.GEMINI_API_KEY}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: "Give me this image as tabular data without '|' separators",
							},
							{
								inline_data: {
									mime_type: "image/jpeg",
									data: arrayBufferToBase64(imageArrayBuffer)
								}
							}
						]
					}
				]
			} as GenerateContentRequest)
		}
	).then(response => response.json())

	const response = fetchResponse as GenerateContentResponse;

	if (!response.candidates) {
		throw new Error('no AI candidates in the response');
	}

	const actualResponse = response
		.candidates[0]
		.content
		.parts
		.map(part => part.text ?? '').join('\n');

	// Cache result
	AITableFromImageMemoizer.set(imageSHA, actualResponse);

	return actualResponse
}