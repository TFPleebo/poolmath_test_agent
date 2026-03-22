# PoolMath Advisor

**Try it live → [tfpleebo.github.io/poolmath_test_agent](https://tfpleebo.github.io/poolmath_test_agent/)**

An AI-powered pool chemistry coach built on the [Trouble Free Pool Care (TFP)](https://www.troublefreepool.com) methodology. Paste your Pool Math share code and get a plain-language read on your water — what's good, what needs attention, and exactly what to do next.

---

## How It Works

1. Open the [Pool Math app](https://www.poolmathapp.com), go to Settings → Share, enable sharing, and copy your link
2. Paste the link or share code into the Advisor
3. Get personalized, TFP-based advice in seconds

The Advisor pulls your recent test history and chemical additions directly from Pool Math, checks each result against TFP targets, and respects data freshness — stale FC or pH readings are flagged rather than acted on.

---

## Stack

- **Frontend** — Static HTML/CSS/JS hosted on GitHub Pages
- **Proxy** — Cloudflare Worker (handles CORS and keeps the API key server-side)
- **AI** — OpenAI Responses API with a stored system prompt and RAG via a vector store loaded with TFP pool chemistry knowledge

---

## Project Files

| File | Description |
|------|-------------|
| `index.html` | The entire frontend — single-file, no dependencies |
| `worker.js` | Cloudflare Worker proxy |
| `pool_chemistry_knowledge.md` | TFP knowledge base uploaded to the OpenAI vector store |
| `poolmath_system_prompt_v*.md` | Versioned system prompts |

---

## Notes

- This is a TFP-methodology tool — it will never recommend algaecide, clarifier, flocculant, or pool store "shock"
- Advice is based on your actual logged test data, not guesses
- Always use your own judgment and the full [TFP resources](https://www.troublefreepool.com) for complex situations like a SLAM
