import { BasicLensIdentifier, LensDescription } from "./types";

// Requests

type EventCrawlRequest = {
	type: 'CRAWL_REQUEST',
	newRequestId: string,
};

type EventOptionChanged = {
	type: 'OPTION_CHANGED',
	option: 'DISABLE_FAIL_FAST',
	field: string,
	value: boolean,
};

type EventMoreCrawlRequest = {
	type: 'MORE_CRAWL',
	lensIdentifier: BasicLensIdentifier,
	requestId: string,
}

type EventRequest = EventCrawlRequest | EventOptionChanged | EventMoreCrawlRequest;

// Responses

type EventCrawlResponseSuccess = {
	type: 'CRAWL_RESPONSE',
	success: true;
	requestId: string,
	lensDesription: Partial<LensDescription>,
}

type EventCrawlResponseError = {
	type: 'CRAWL_RESPONSE',
	success: false;
	requestId: string,
	error: string,
}

type EventMoreCrawlResponseSuccess = {
	type: 'MORE_CRAWL_RESPONSE',
	success: true;
	lensDesription: Partial<LensDescription>
}

type EventCrawlResponse = EventCrawlResponseSuccess | EventCrawlResponseError;
type EventMoreCrawlResponse = EventMoreCrawlResponseSuccess;

type EventResponse = EventCrawlResponse | EventMoreCrawlResponse;

export type ChromeExtensionEvent = EventRequest | EventResponse;


export function sendMessageToTab(tabId: number, event: ChromeExtensionEvent) {
	chrome.tabs.sendMessage(tabId as number, event);
}

export function sendMessageToCurrentTab(event: ChromeExtensionEvent) {
	chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
		sendMessageToTab(tab.id as number, event)
	});
}

export function sendMessageToAllTabs(event: ChromeExtensionEvent) {
	chrome.tabs.query({}).then((tabs) => {
		tabs.forEach(tab => {
			sendMessageToTab(tab.id as number, event)
		})
	});
}

export function sendMessageToExtension(event: ChromeExtensionEvent) {
	chrome.runtime.sendMessage(event);
}


export function listenToEvents(cb: (event: ChromeExtensionEvent) => void) {
	chrome.runtime.onMessage.addListener(
		(message, _: chrome.runtime.MessageSender, __: () => void): undefined => {
			cb(message)
		})
}