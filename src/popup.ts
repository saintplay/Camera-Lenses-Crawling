const buttonEl = document.getElementById("crawl-specs-button");

const errorResultEl = document.getElementById("crawl-results-error");
const successResultEl = document.getElementById("crawl-results-success");

const errorResultWrapperEl = document.getElementById("crawl-results-error-wrapper");
const successResultWrapperEl = document.getElementById("crawl-results-sucess-wrapper");

const disableFaiLFastOptionEls: NodeListOf<HTMLInputElement> = document.querySelectorAll(".options-container input[type=checkbox]");

function sendMessageToCurrentTab(data: unknown) {
    chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
        chrome.tabs.sendMessage(tab.id as number, data);
    });
}


buttonEl?.addEventListener("click", () => {
    sendMessageToCurrentTab({ type: "CRAWL_REQUEST" });
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


chrome.runtime.onMessage.addListener(
    (message, _: chrome.runtime.MessageSender, __: () => void): undefined => {
        const { data, type } = message;

        if (type === "CRAWL_RESULTS_ERROR") {
            successResultWrapperEl?.setAttribute("class", "hidden")
            errorResultWrapperEl?.setAttribute("class", "visible")

            if (errorResultEl) {
                errorResultEl.innerHTML = "";
                errorResultEl.appendChild(document.createTextNode(data))
            }
        } else if (type === "CRAWL_RESULTS_SUCCESS") {
            successResultWrapperEl?.setAttribute("class", "visible")
            errorResultWrapperEl?.setAttribute("class", "hidden")

            if (successResultEl) {
                successResultEl.innerHTML = "";
                successResultEl.innerText = data;
            }
        }
    }
)
