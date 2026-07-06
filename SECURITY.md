# Security Policy

ZUREON takes the security of its users seriously.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately — do not open a public GitHub issue.

Email: founders@zureon.app

Include a description of the issue, steps to reproduce, and any relevant logs or screenshots. We aim to acknowledge reports within 48 hours.

## Scope

This repository contains the client-side HUB application only. It does not handle wallet private keys or seed phrases — signing always happens in the user's own TON Connect wallet. The backend AI proxy, rate limiting, and prompt-injection guards referenced in the README live in ZUREON's main site repository and are out of scope for reports against this repo specifically, though we welcome those reports at the same address.
