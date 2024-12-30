document.getElementById("crawl-specs-button")?.addEventListener("click", () => {
    chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id as number },
            files: ['dist/main.js']
        });
    });
});
