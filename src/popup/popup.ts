import { v4 as uuidv4 } from 'uuid';

import { listenToEvents, sendMessageToCurrentTab, sendMessageToAllTabs } from '../events';
import { BasicLensIdentifier } from '../types';
import { getTabbedDescription } from './data-tranform';

const crawlButtonEl = document.getElementById("crawl-specs-button");
const copyButtonEl = document.getElementById("copy-results-button");

const errorResultEl = document.getElementById("crawl-results-error");
const successResultEl = document.getElementById("crawl-results-success");

const errorResultWrapperEl = document.getElementById("crawl-results-error-wrapper");
const successResultWrapperEl = document.getElementById("crawl-results-sucess-wrapper") as HTMLPreElement;

const disableFaiLFastOptionEls: NodeListOf<HTMLInputElement> = document.querySelectorAll(".options-container input[type=checkbox]");

crawlButtonEl?.addEventListener("click", () => {
    const newRequestId = uuidv4();
    sendMessageToCurrentTab({ type: "CRAWL_REQUEST", newRequestId });
});

copyButtonEl?.addEventListener("click", () => {
    if (successResultEl) {
        window.getSelection()?.selectAllChildren(successResultEl);
    }
    document.execCommand("copy");
});

disableFaiLFastOptionEls.forEach(optionEl => {
    optionEl.addEventListener("change", (event) => {
        const name = (event.currentTarget as HTMLInputElement)?.name;

        sendMessageToCurrentTab({
            type: "OPTION_CHANGED",
            option: "DISABLE_FAIL_FAST",
            field: name,
            value: optionEl.checked
        })
    })
});

listenToEvents((event) => {
    const { type } = event;

    if (type === "CRAWL_RESPONSE") {
        if (event.success) {
            const { lensDesription, requestId } = event

            successResultWrapperEl?.setAttribute("class", "visible")
            errorResultWrapperEl?.setAttribute("class", "hidden")
    
            if (successResultEl) {
                successResultEl.innerHTML = "";
                successResultEl.innerText = getTabbedDescription(lensDesription);
            }
    
            // TODO: Make the check for this
            // If there is lacking information, request more information from other tabs
            sendMessageToAllTabs({ type: "MORE_CRAWL", lensIdentifier: {} as BasicLensIdentifier, requestId })
        } else {
            const { error } = event
    
            successResultWrapperEl?.setAttribute("class", "hidden")
            errorResultWrapperEl?.setAttribute("class", "visible")
    
            if (errorResultEl) {
                errorResultEl.innerHTML = "";
                errorResultEl.appendChild(document.createTextNode(error))
            }
        }
        
    }
    else if (type === "MORE_CRAWL_RESPONSE") {
        // TODO: Handle this
    }
})
