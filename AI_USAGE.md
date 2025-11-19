# AI Usage in AI-Studio-Mini

This document captures how AI tooling was leveraged while building the project and clarifies that the runtime experience relies on **local simulations**, not external AI inference.

## 1. Where AI tools helped during development

| Area | AI Tool | How it was used |
| --- | --- | --- |
| Frontend retry UX | GitHub Copilot / ChatGPT | Drafted initial copies for retry/abort banners, suggested small refactors in `useRetry` and `useGenerate`. |
| Playwright resilience | ChatGPT | Helped prototype the first version of `createGenerationWithRetry`, later tuned manually for logging and error handling. |
| Documentation & PR text | ChatGPT | Assisted in drafting sections of `AI_USAGE.md`, PR descriptions, and commit summaries; all final text was reviewed before commit. |
| Manual-only areas | — | Database schema changes, controller logic, auth flow, CI scripts, and all tests were authored and validated by hand without AI completion. |

## 2. AI behavior inside the product

| Feature | Location | Description |
| --- | --- | --- |
| Generation latency | `backend/src/services/generation.ts` | Adds a 1–2 second delay to mimic inference time. |
| “Model overloaded” 503s | `backend/src/controllers/generations.ts` | Randomly emits 20 % 503 responses so retry logic has a realistic trigger. |
| Placeholder outputs | `backend/src/services/generation.ts` | Generates deterministic placeholder URLs when no upload is provided. |
| Image previews | `frontend/src/components/Upload.tsx` | Uses `FileReader` to show previews entirely in-browser. |

**Important:** During local dev, tests, and CI, the app never calls real third-party AI APIs. Everything stays self-contained.

## 3. Why simulate instead of calling real models?

1. **Deterministic testing:** Playwright/Vitest/Jest can run in offline sandboxes without flaking.
2. **No secrets required:** Contributors don’t need vendor keys or billing accounts to get started.
3. **Faster iteration on UX:** Retry/abort/past-generation flows can be polished without waiting for real inference.

## 4. Hooking in a real model later

1. Replace the placeholder logic inside `GenerationService.create` with your provider call (OpenAI Images, Stability, internal inference, etc.).
2. Remove or adapt the 503 simulation block if the provider exposes its own rate-limit signals.
3. Update the Playwright helper (`createGenerationWithRetry`) and frontend hook (`useRetry`) to follow the provider’s retry/backoff guidance.
4. Tighten observability, rate limiting, and error reporting before productionizing.

## 5. Takeaways

- AI assistants sped up boilerplate and documentation but every change was reviewed, tested, and committed manually.
- The shipped application does **not** send user data to external AI services; it only simulates their behavior.
- Clear integration points are in place should you decide to plug in a real model in the future.***

