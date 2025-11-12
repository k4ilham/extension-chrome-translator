// Background service worker for context menu translation

// Create context menu items on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate-id-en",
    title: "Translate Indonesia → English",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "translate-en-id",
    title: "Translate English → Indonesia",
    contexts: ["selection"]
  });
});

async function translateText(text, source, target) {
  const payload = { q: text, source, target, format: "text" };
  const endpoints = [
    "https://libretranslate.com/translate",
    "https://translate.astian.org/translate",
    "https://libretranslate.de/translate",
    "https://translate.argosopentech.com/translate"
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.translatedText) return data.translatedText;
      }
    } catch (err) {
      // continue to next endpoint on error/timeout
    }
  }
  // Fallback: MyMemory free API
  try {
    const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const resp = await fetch(u, { headers: { "Accept": "application/json" } });
    if (resp.ok) {
      const data = await resp.json();
      const t = data?.responseData?.translatedText;
      if (t) return t;
    }
  } catch (err) {}
  throw new Error("Translation failed");
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    const original = (info.selectionText || "").trim();
    if (!original) return;
    let source = "id";
    let target = "en";
    if (info.menuItemId === "translate-en-id") {
      source = "en";
      target = "id";
    }
    const translated = await translateText(original, source, target);
    const payload = { type: "showTranslation", original, translated, source, target };
    if (tab && tab.id != null) {
      chrome.tabs.sendMessage(tab.id, payload);
    }
  } catch (err) {
    if (tab && tab.id != null) {
      chrome.tabs.sendMessage(tab.id, {
        type: "showTranslation",
        original: info.selectionText,
        translated: `Error: ${err?.message || err}`
      });
    }
  }
});