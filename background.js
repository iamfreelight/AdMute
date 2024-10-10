let mutedTabs = new Set();
let intervals = {};

chrome.tabs.onActivated.addListener(activeInfo => {
  startPolling(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    startPolling(tabId);
  }
});

function startPolling(tabId) {
  if (intervals[tabId]) {
    clearInterval(intervals[tabId]);
  }

  intervals[tabId] = setInterval(() => {
    checkTab(tabId);
  }, 2000); // Poll every 1 second
}

function checkTab(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (!chrome.runtime.lastError && tab && tab.active && (tab.url.includes("hulu.com"))) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: scanForAdTextHLU
      }, (results) => {
        if (results && results[0].result) {
          muteTab(tabId);
        } else if (mutedTabs.has(tabId)) {
          unmuteTab(tabId);
        }
      });
    } else {
      // If tab is no longer valid, clear polling for it
      clearInterval(intervals[tabId]);
      delete intervals[tabId];
    }
  });
}

function scanForAdTextHLU() {
  // Target the div with the class 'AdUnitView__adBar__timer'
  const adDiv = document.querySelector('.AdUnitView__adBar__timer');  
  
  // Check if the adDiv exists
  if (adDiv) {
    // Trim and check if the text content is empty
    if (adDiv.textContent.trim().length === 0) {
      //console.log("No ad is being played (ad div content is empty).");
      return false; // No ad is being played
    } else {
      //console.log("An ad is being played (ad div content is not empty).");
      return true; // Ad is being played
    }
  } else {
    //console.log("Ad div not found.");
    return false; // Ad div doesn't exist
  }
}


function muteTab(tabId) {
  chrome.tabs.update(tabId, { muted: true });
  mutedTabs.add(tabId);
}

function unmuteTab(tabId) {
  chrome.tabs.update(tabId, { muted: false });
  mutedTabs.delete(tabId);
}
