(function () {
  const directionEl = document.getElementById("direction");
  const endpointEl = document.getElementById("endpoint");
  const inputEl = document.getElementById("inputText");
  const resultEl = document.getElementById("resultText");
  const statusEl = document.getElementById("status");
  const btnTranslate = document.getElementById("translateBtn");
  const btnCopy = document.getElementById("copyBtn");
  const btnClear = document.getElementById("clearBtn");

  const hasChromeStorage = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  const ENDPOINTS = {
    auto: [
      "https://libretranslate.com/translate",
      "https://translate.astian.org/translate",
      "https://libretranslate.de/translate",
      "https://translate.argosopentech.com/translate"
    ],
    "libretranslate.com": "https://libretranslate.com/translate",
    "translate.astian.org": "https://translate.astian.org/translate",
    "libretranslate.de": "https://libretranslate.de/translate",
    "argosopentech": "https://translate.argosopentech.com/translate"
  };

  function setStatus(text) {
    statusEl.textContent = text || "";
  }

  function parseDirection(val) {
    return val === "en-id" ? { source: "en", target: "id" } : { source: "id", target: "en" };
  }

  async function requestTranslate(url, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data || !data.translatedText) throw new Error("Invalid response");
    return data.translatedText;
  }

  async function translateText(text, source, target, endpointChoice) {
    const payload = { q: text, source, target, format: "text" };

    if (endpointChoice && endpointChoice !== "auto") {
      setStatus(`Menerjemahkan via ${endpointChoice}...`);
      return await requestTranslate(ENDPOINTS[endpointChoice], payload);
    }

    const urls = ENDPOINTS.auto;
    for (const url of urls) {
      try {
        setStatus(`Mencoba ${new URL(url).host}...`);
        const result = await requestTranslate(url, payload);
        return result;
      } catch (err) {
        // continue to next endpoint
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

  async function onTranslate() {
    const dir = parseDirection(directionEl.value);
    const text = (inputEl.value || "").trim();
    if (!text) {
      setStatus("Masukkan teks terlebih dahulu.");
      return;
    }
    btnTranslate.disabled = true;
    setStatus("Menerjemahkan...");
    try {
      const choice = (endpointEl && endpointEl.value) || "auto";
      const result = await translateText(text, dir.source, dir.target, choice);
      resultEl.value = result;
      setStatus("Selesai.");
    } catch (err) {
      setStatus(`Error: ${err?.message || err}`);
    } finally {
      btnTranslate.disabled = false;
    }
  }

  btnTranslate.addEventListener("click", onTranslate);
  btnCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(resultEl.value || "");
      setStatus("Hasil disalin ke clipboard.");
    } catch {
      setStatus("Gagal menyalin.");
    }
  });
  btnClear.addEventListener("click", () => {
    inputEl.value = "";
    resultEl.value = "";
    setStatus("");
  });

  // Persist last direction + endpoint choice
  if (hasChromeStorage) {
    try {
      chrome.storage.local.get({ direction: "id-en", endpoint: "auto" }, (res) => {
        if (res && res.direction) directionEl.value = res.direction;
        if (res && res.endpoint && endpointEl) endpointEl.value = res.endpoint;
      });
      directionEl.addEventListener("change", () => {
        chrome.storage.local.set({ direction: directionEl.value });
      });
      endpointEl.addEventListener("change", () => {
        chrome.storage.local.set({ endpoint: endpointEl.value });
      });
    } catch {}
  } else {
    // Fallback to localStorage for preview
    try {
      const savedDir = localStorage.getItem("direction") || "id-en";
      const savedEp = localStorage.getItem("endpoint") || "auto";
      directionEl.value = savedDir;
      if (endpointEl) endpointEl.value = savedEp;
      directionEl.addEventListener("change", () => {
        localStorage.setItem("direction", directionEl.value);
      });
      endpointEl.addEventListener("change", () => {
        localStorage.setItem("endpoint", endpointEl.value);
      });
    } catch {}
  }
})();