# WonderTales Studio

Mobile-first bilingual story studio for **WonderTales Kids** (English) and **عالم الحكايات** (simple Modern Standard Arabic).

## Current MVP
- Responsive Arabic-first interface designed for iPhone Safari.
- One story idea produces two separately written language versions.
- Recurring cast and setting are included in the generation instructions:
  - Foxy: orange fox with a green backpack
  - Bobo: small blue dragon
  - Pip: little yellow bird
  - Wonder Forest
- Scene breakdowns with visual prompts and narration.
- NVIDIA API key is used server-side and is never sent to the browser.
- Rate-limited API endpoint and basic security headers.
- PWA manifest for adding the studio to the iPhone Home Screen.

## Run locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `NVIDIA_API_KEY` and, if needed, `NVIDIA_MODEL`.
5. Run `npm start` and open `http://localhost:3000`.

## Railway deployment
- Connect this repository to a **new, separate Railway service/project** only when resources are available.
- Set `NVIDIA_API_KEY` as a Railway variable (never commit it).
- Set `NVIDIA_MODEL` to a model enabled for your NVIDIA API account.
- Railway uses the `npm start` command.

## Important scope and safety
This is the first working foundation, not yet a complete automated video factory. Image/video generation, voice generation, timeline rendering, persistent episode storage, YouTube OAuth, scheduling, and production authentication are not implemented yet. Do not expose this MVP publicly with sensitive episode data until authentication is added. Videos must remain private/unlisted until a human reviews them and approves publishing.

Free NVIDIA endpoint availability, model access, rate limits, and quotas depend on the account and current NVIDIA terms. The app does not promise unlimited free generation.

## Secrets
Never put API keys in source files, frontend JavaScript, screenshots, or Git commits. Use host environment variables.
