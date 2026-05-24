// Lekkal — shared LLM API price table (single source of truth).
//
// Prices are USD per 1,000,000 tokens (the unit every major provider quotes).
// These are INDICATIVE list prices for quick estimation. Providers change
// pricing often and add/retire models — always confirm against the provider's
// pricing page before relying on a number. This file is the one place to
// update; a nightly job can rewrite AI_PRICES + AI_PRICES_UPDATED here.
//
// Last reviewed: 2026-05-23

window.AI_PRICES_UPDATED = "2026-05-23";

// in  = input / prompt tokens, USD per 1M
// out = output / completion tokens, USD per 1M
window.AI_PRICES = [
  // ---- OpenAI ----
  { provider: "OpenAI",    model: "GPT-5.5",             in: 5.00,  out: 30.00 },
  { provider: "OpenAI",    model: "GPT-5.4",             in: 2.50,  out: 15.00 },
  { provider: "OpenAI",    model: "GPT-5.4 mini",        in: 0.75,  out: 4.50  },
  { provider: "OpenAI",    model: "GPT-5.4 nano",        in: 0.20,  out: 1.25  },
  // ---- Anthropic ----
  { provider: "Anthropic", model: "Claude Opus 4.7",     in: 5.00,  out: 25.00 },
  { provider: "Anthropic", model: "Claude Sonnet 4.6",   in: 3.00,  out: 15.00 },
  { provider: "Anthropic", model: "Claude Haiku 4.5",    in: 1.00,  out: 5.00  },
  { provider: "Anthropic", model: "Claude Haiku 3",      in: 0.25,  out: 1.25  },
  // ---- Google ----
  { provider: "Google",    model: "Gemini 3.1 Pro",      in: 2.00,  out: 12.00 },
  { provider: "Google",    model: "Gemini 3.5 Flash",    in: 1.50,  out: 9.00  },
  { provider: "Google",    model: "Gemini 3.1 Flash-Lite",in: 0.25, out: 1.50  },
  // ---- xAI ----
  { provider: "xAI",       model: "Grok 4",              in: 3.00,  out: 15.00 },
  { provider: "xAI",       model: "Grok 4.20",           in: 2.00,  out: 6.00  },
  { provider: "xAI",       model: "Grok 4.1 Fast",       in: 0.20,  out: 0.50  },
  // ---- Other / open-weight via hosted APIs ----
  { provider: "DeepSeek",  model: "DeepSeek V3.1",       in: 0.15,  out: 0.75  },
  { provider: "Mistral",   model: "Mistral Small",       in: 0.20,  out: 0.60  },
  { provider: "Mistral",   model: "Mistral Nemo",        in: 0.02,  out: 0.04  },
  { provider: "Meta",      model: "Llama 3.3 70B (Groq)",in: 0.59,  out: 0.79  },
];

// Populate a <select> with grouped options (by provider). Returns nothing;
// sets the select's options and selects `defaultModel` if provided.
window.populateModelSelect = function (sel, defaultModel) {
  const byProvider = {};
  window.AI_PRICES.forEach((p, i) => {
    (byProvider[p.provider] = byProvider[p.provider] || []).push({ ...p, i });
  });
  sel.innerHTML = "";
  Object.keys(byProvider).forEach((prov) => {
    const og = document.createElement("optgroup");
    og.label = prov;
    byProvider[prov].forEach((p) => {
      const o = document.createElement("option");
      o.value = String(p.i);
      o.textContent = p.model;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
  if (defaultModel != null) {
    const idx = window.AI_PRICES.findIndex((p) => p.model === defaultModel);
    if (idx > -1) sel.value = String(idx);
  }
};

// Convenience: look up a price row by its index in AI_PRICES.
window.priceFor = function (i) { return window.AI_PRICES[+i] || null; };
