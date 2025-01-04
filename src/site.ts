import { listenToEvents, sendMessageToExtension } from './events';

interface CrawlingOptions {
    disableFailFast: {
        weightGR?: boolean;
        currentPrice?: boolean;
        sensorCoverage?: boolean;
        OIS?: boolean;
        minimumAperture?: boolean;
    }
}

const CRAWLING_OPTIONS: CrawlingOptions = {
    disableFailFast: {}
}

const FULFILLED_REQUEST_IDS: {
    [requestId: string]: boolean;
} = {};

listenToEvents((event) => {
    const { type } = event;

    if (type === "OPTION_CHANGED") {
        const { option, field, value }: { option: string; field: string; value: boolean } = event;

        if (option === "DISABLE_FAIL_FAST") {
            CRAWLING_OPTIONS.disableFailFast[field as keyof CrawlingOptions['disableFailFast']] = value
        }

    }

    else if (type === "CRAWL_REQUEST") {
        const { newRequestId } = event;

        // Ignore if request was already handled
        if (FULFILLED_REQUEST_IDS[newRequestId]) return;

        try {
            const lensDesription = crawlLensDescription();

            console.log("Lens Specs Info Crawled");
            console.log(lensDesription);


            sendMessageToExtension({ type: "CRAWL_RESPONSE", success: true, lensDesription, requestId: newRequestId })
        } catch (error) {
            sendMessageToExtension({ type: "CRAWL_RESPONSE", success: false, error: String(error), requestId: newRequestId })
        }
    }

    else if (type === "MORE_CRAWL") {
        const { requestId } = event


        // Only send more info from tabs that did not handle the request before
        if (FULFILLED_REQUEST_IDS[requestId]) return;

        try {
            const lensDesription = crawlLensDescription();

            console.log("Mores Lens Specs Info Crawled");
            console.log(lensDesription);

            FULFILLED_REQUEST_IDS[requestId] = true;

            sendMessageToExtension({ type: "MORE_CRAWL_RESPONSE", success: true, lensDesription })
        } catch (error) {
            // TODO: send to extension?
            console.error(error)
        }
    }
})
