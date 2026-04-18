# Contributing to Communication Compositor

Welcome — and thank you. This started as a personal tool; help making it useful for everyone is very welcome.

## Where to start

Check [ROADMAP.md](ROADMAP.md). The highest-value contributions right now:

1. **Graph API wiring** (items 2 & 3) — replace mock data with live OneNote calls
2. **Word XML `^p` fix** (item 1) — correct paragraph handling in document assembly  
3. **Prompt parser** (item 3) — fuzzy section matching with confirmation step

## How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Open a pull request with a clear description

## Principles

- **Mock data stays clean** — `src/mock/data.js` must contain entirely fictional data. No real names, emails or personal content.
- **App must run offline** — live Graph API is an enhancement, not a requirement. Mock data path must always work.
- **One thing per PR** — keep pull requests focused.
- **Discuss big changes first** — open an issue before starting major architectural work.

## Questions?

Open an issue — happy to discuss.
