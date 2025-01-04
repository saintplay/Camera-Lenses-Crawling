import { v4 as uuidv4 } from 'uuid';

import { listenToEvents, sendMessageToCurrentTab, sendMessageToAllTabs } from '../events';
import { BasicLensIdentifier } from '../types';
import { getTabbedDescription } from './data-tranform';

const buttonEl = document.getElementById("crawl-specs-button");

const errorResultEl = document.getElementById("crawl-results-error");
const successResultEl = document.getElementById("crawl-results-success");

const errorResultWrapperEl = document.getElementById("crawl-results-error-wrapper");
const successResultWrapperEl = document.getElementById("crawl-results-sucess-wrapper");

const disableFaiLFastOptionEls: NodeListOf<HTMLInputElement> = document.querySelectorAll(".options-container input[type=checkbox]");

buttonEl?.addEventListener("click", () => {
    const newRequestId = uuidv4();
    sendMessageToCurrentTab({ type: "CRAWL_REQUEST", newRequestId });
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
    
            // Todo: If there is lacking information, request more information from other tabs
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
    }
})
