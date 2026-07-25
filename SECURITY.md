# Security Policy

ZUREON takes the security of its users seriously.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately — do not open a public GitHub issue.

Email: founders@zureon.app

Include a description of the issue, steps to reproduce, and any relevant logs or screenshots. We aim to acknowledge reports within 48 hours.

## Scope

This repository contains the client-side HUB application only. It does not handle wallet private keys or seed phrases — signing always happens in the user's own TON Connect wallet. The backend AI proxy, rate limiting, and prompt-injection guards referenced in the README live in ZUREON's main site repository and are out of scope for reports against this repo specifically, though we welcome those reports at the same address.

## Dependency security

The app ships as a static export (`output: 'export'`) — plain HTML/JS with no server runtime. Runtime dependencies are kept clean:

```
npm audit --omit=dev   →   0 vulnerabilities
```

A plain `npm audit` also reports advisories in the **development/build toolchain** (the ESLint plugin chain and `tar`). These packages run only at lint/build time on a developer or CI machine — none are part of the shipped bundle served to users, and the current advisories have no non-breaking upstream fix (the only `npm audit fix --force` path downgrades ESLint to an ancient release). We track them and will pick up fixes as they land upstream.
