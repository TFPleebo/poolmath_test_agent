/**
 * Pool Advisor – Cloudflare Worker
 *
 * Flow:
 *  1. Receive POST { shareCode: "XXXXXX" } from the GitHub Pages frontend
 *  2. Fetch pool data from the Pool Math share API
 *  3. Pass the data to your OpenAI stored prompt
 *  4. Return { advice: "..." } to the frontend
 *
 * Required environment variable (set in Cloudflare dashboard → Workers → Settings → Variables):
 *   OPENAI_API_KEY   — your OpenAI secret key
 */

const OPENAI_PROMPT_ID      = "pmpt_689640b386288194b7b92935ea30dc9c05a10f950bcaa175";
const OPENAI_PROMPT_VERSION = "16";
const OPENAI_VECTOR_STORE   = "vs_hKTsOCNCResFZYaPXtuBuo6R";

// Allow any origin so the page works when opened locally (file://) AND from GitHub Pages.
// This is safe because your OpenAI key is stored here in the Worker, not in the browser.
// Once you go live, you can restrict this to your GitHub Pages URL if you prefer.
const CORS_ORIGIN = "*";

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": CORS_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ error: "Only POST requests are accepted." }, 405, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400, corsHeaders);
    }

    const shareCode = (body.shareCode || "").trim();
    if (!shareCode) {
      return json({ error: "shareCode is required." }, 400, corsHeaders);
    }

    // ------------------------------------------------------------------
    // 1. Fetch Pool Math share data
    // ------------------------------------------------------------------
    let poolData;
    try {
      poolData = await fetchPoolMathData(shareCode);
    } catch (err) {
      return json({ error: `Failed to fetch Pool Math data: ${err.message}` }, 502, corsHeaders);
    }

    // ------------------------------------------------------------------
    // 2. Call OpenAI Responses API with your stored prompt
    // ------------------------------------------------------------------
    let advice;
    try {
      advice = await callOpenAI(poolData, env.OPENAI_API_KEY);
    } catch (err) {
      return json({ error: `OpenAI error: ${err.message}` }, 502, corsHeaders);
    }

    return json({ advice }, 200, corsHeaders);
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetch pool data from the Pool Math share endpoint.
 * The Pool Math app exposes share data at:
 *   https://troublefreepool.com/mypool/{shareCode}
 * We request JSON by setting Accept: application/json.
 * Adjust the parsing below if the response shape differs.
 */
async function fetchPoolMathData(shareCode) {
  const url = `https://api.poolmathapp.com/share/${encodeURIComponent(shareCode)}.json`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PoolAdvisorBot/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from Pool Math`);
  }

  // Try JSON first; fall back to raw text so OpenAI can still reason about it
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  // HTML / plain-text fallback – pass raw text to OpenAI
  const text = await res.text();
  return { rawHtml: text };
}

/**
 * Call the OpenAI Responses API using your stored prompt.
 * The pool data is injected as a user message so the AI can reference it.
 */
async function callOpenAI(poolData, apiKey) {
  const poolSummary = typeof poolData === "string"
    ? poolData
    : JSON.stringify(poolData, null, 2);

  const payload = {
    model: "gpt-5.4-mini",
    prompt: {
      id: OPENAI_PROMPT_ID,
      version: OPENAI_PROMPT_VERSION,
    },
    input: [
      {
        role: "user",
        content: `Here is the latest pool data from Pool Math:\n\n${poolSummary}\n\nPlease analyze this and give me clear, actionable advice.`,
      },
    ],
    reasoning: { summary: "auto" },
    tools: [
      {
        type: "file_search",
        vector_store_ids: [OPENAI_VECTOR_STORE],
      },
    ],
    store: true,
    include: [
      "reasoning.encrypted_content",
      "web_search_call.action.sources",
    ],
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status} – ${errText}`);
  }

  const data = await res.json();

  // Extract the assistant's text from the response output array
  const outputs = data.output || [];
  for (const item of outputs) {
    if (item.type === "message" && item.role === "assistant") {
      const content = item.content || [];
      const textBlock = content.find((c) => c.type === "output_text" || c.type === "text");
      if (textBlock) return textBlock.text || textBlock.value || "";
    }
  }

  // Fallback: return the whole response as a string
  return JSON.stringify(data, null, 2);
}

/** Convenience: return a JSON Response */
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
