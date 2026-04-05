# PoolMath AI Advisor

**Try it live → [tfpleebo.github.io/poolmath_test_agent](https://tfpleebo.github.io/poolmath_test_agent)**

A pool chemistry advisor built on the [Trouble Free Pool Care (TFP)](https://www.troublefreepool.com) methodology. Paste your Pool Math share code and get a plain-language read on your water — what's good, what needs attention, and exactly what to do next.

> **Status: Early Access / Beta** — actively being tested and refined. Errors will occur.

---

## How It Works

1. Open the **Pool Math app**, go to Settings → Share, enable sharing, and copy your link
2. Paste the link or share code into the Advisor
3. Get personalized, TFP-based advice in seconds

The Advisor pulls your recent test history and chemical additions directly from Pool Math and passes them through two layers:

- **Deterministic ruleset** — a code-based set of rules evaluates each parameter against TFP targets, assigns severity levels (critical / warning / info), and determines the primary issue. No AI involved in this step.
- **AI communication layer** — the coded results are handed to the AI, whose only job is to turn them into clear, plain-language advice the end user can actually act on.

Data freshness is respected throughout — stale FC or pH readings are flagged rather than acted on.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML/CSS/JS hosted on GitHub Pages |
| Proxy | Cloudflare Worker — handles CORS, keeps API key server-side |
| AI | OpenAI Responses API with stored system prompt + RAG via vector store |
| Knowledge | TFP pool chemistry knowledge base loaded into vector store |

---

## Privacy

Your pool data is sent to the Cloudflare Worker, which forwards it to the OpenAI API. Your API key is never exposed to the client. No data is stored or logged beyond what OpenAI retains per their standard policy.

---

## Known Limitations

- Reads a **snapshot** of current data only — no memory of past tests or chemical additions
- Weather and UV index are not yet factored into recommendations
- Trend analysis (tracking changes over time) is not yet implemented
- Cost controls and usage guardrails for public release are not yet in place

---

## Version History

| Date | Prompt | Worker | Notes |
|---|---|---|---|
| April 5, 2026 | v25 | worker_updated.js | Initial live deployment |

---

## Notes

This repository may not always reflect the latest deployed code. The live tool and the files here can be out of sync during active development.
