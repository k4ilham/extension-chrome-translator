// Content script to display translation overlay near selected text

function ensureStyles() {
  if (document.getElementById("id-en-translator-style")) return;
  const style = document.createElement("style");
  style.id = "id-en-translator-style";
  style.textContent = `
  .id-en-translator-overlay { 
    position: absolute; 
    max-width: 360px; 
    background: #ffffff; 
    color: #111; 
    border: 1px solid rgba(0,0,0,0.1); 
    border-radius: 8px; 
    box-shadow: 0 8px 24px rgba(0,0,0,0.2); 
    z-index: 2147483647; 
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; 
    padding: 10px 12px; 
  }
  .id-en-translator-overlay h1 { 
    margin: 0 0 6px; 
    font-size: 13px; 
    font-weight: 600; 
    color: #333; 
  }
  .id-en-translator-overlay .orig { 
    margin: 4px 0; 
    font-size: 12px; 
    color: #666; 
  }
  .id-en-translator-overlay .result { 
    margin: 6px 0 8px; 
    font-size: 13px; 
    line-height: 1.4; 
  }
  .id-en-translator-overlay .actions { 
    display: flex; 
    gap: 8px; 
  }
  .id-en-translator-overlay button { 
    border: 1px solid #d0d7de; 
    background: #f6f8fa; 
    border-radius: 6px; 
    padding: 4px 8px; 
    font-size: 12px; 
    cursor: pointer; 
  }
  .id-en-translator-overlay button:hover { 
    background: #eef1f4; 
  }
  `;
  document.head.appendChild(style);
}

function showOverlay({ original, translated, source, target }) {
  ensureStyles();
  const sel = window.getSelection();
  let rect = null;
  try {
    rect = sel && sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null;
  } catch {}
  const top = (rect ? rect.bottom : 0) + window.scrollY + 8;
  const left = (rect ? rect.left : 0) + window.scrollX;

  const el = document.createElement("div");
  el.className = "id-en-translator-overlay";
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
  const dir = source && target ? `${source.toUpperCase()} → ${target.toUpperCase()}` : "";
  el.innerHTML = `
    <h1>Translated ${dir}</h1>
    <div class="orig"><strong>Source:</strong> ${escapeHtml(original || "")}</div>
    <div class="result">${escapeHtml(translated || "")}</div>
    <div class="actions">
      <button id="copyBtn">Copy</button>
      <button id="closeBtn">Close</button>
    </div>
  `;
  document.body.appendChild(el);
  const remove = () => el.remove();
  el.querySelector("#closeBtn").addEventListener("click", remove);
  el.querySelector("#copyBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(translated || "");
      el.querySelector("#copyBtn").textContent = "Copied";
    } catch {}
  });
  // Auto hide after 12s
  setTimeout(remove, 12000);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "showTranslation") {
    showOverlay(msg);
  }
});