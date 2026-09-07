# Security Policy

We take security seriously. If you believe you have found a vulnerability in UptimeCrow, please disclose it responsibly using the process below.

## Supported versions

Security fixes land on `main` and in the next release. Self-hosters should run a
recent tagged release; `:latest` tracks `main` and is not a supported target for
a security report ("it broke after a `latest` pull" is a bug report, not an
advisory).

| Version | Supported |
|---|---|
| `main` / latest release | Yes |
| Older releases | Upgrade first; we backport only if the upgrade path is broken |

## Reporting a vulnerability

**Email:** [security@uptimecrow.com](mailto:security@uptimecrow.com)

Please include:

- A description of the vulnerability and its potential impact
- Step-by-step reproduction (URLs, payloads, code snippets)
- The version or commit SHA you tested against
- Whether the issue is reachable in the managed service ([uptimecrow.com](https://uptimecrow.com)) or only in self-host
- Your name / handle if you would like credit

**Do not open a public GitHub issue for security reports.** Do not disclose the issue on Twitter, blogs, or Discord before we have responded.

## What to expect

| Timeline | What we do |
|---|---|
| Within 2 business days | Initial acknowledgment, triage |
| Within 7 business days | First assessment: confirmed / not-a-bug / need more info |
| Confirmed issue | We agree a fix and disclosure timeline with you |
| After fix | Public advisory via [GitHub Security Advisories](https://github.com/ozers/uptimecrow/security/advisories), credit to you unless you ask otherwise |

We aim to ship fixes for high-severity issues within **14 days** of confirmation. Lower-severity issues may roll into the next scheduled release.

## Scope

In scope:

- This repository (`ozers/uptimecrow`) and the managed service at `uptimecrow.com`, `*.uptimecrow.com`
- Vulnerabilities in our authentication, authorization, multi-tenancy isolation, SSRF protections, rate limiting, webhook signing, status page rendering

Out of scope:

- Denial-of-service attacks against the managed service
- Social engineering of UptimeCrow staff or users
- Findings from automated scanners without a working proof-of-concept
- Issues in third-party services we depend on (please report those directly to the upstream vendor)
- Theoretical issues that require an unrealistic threat model (e.g., physical access, malicious internal user with admin privileges)

## Safe harbor

If you make a good-faith effort to comply with this policy:

- We will not pursue legal action against you for security research conducted under this policy
- We will work with you to understand and resolve the issue quickly
- We will publicly credit you (if you wish) once the fix is shipped

We do not currently run a paid bug bounty program. If we add one, this page will be updated.

## PGP

We do not currently publish a PGP key. Email is sufficient. If you require PGP, mention it in your first email and we will arrange a key exchange.
