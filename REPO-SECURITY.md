# Repository Security

Guidance applied: 2026-10-16

## Scope

This repository contains the ESM-only TypeScript package `@anderjason/textrange`, Vitest tests, and a version 3 npm lockfile. The published package has no runtime dependencies.

The repository has no GitHub Actions workflows, deployment workflows, server runtime, native runtime, package-manager authentication files, or committed editor automation.

## Threats

The main risks are compromised development dependencies, install-time code, unexpected lockfile changes, hostile content reaching test tooling, and unauthorized package publication.

Dependency installation, builds, tests, and packaging execute third-party code. Run them in an isolated environment without personal credentials, SSH agents, password-manager state, browser state, cloud configuration, publishing credentials, or writable user startup files.

## Controls

- `package-lock.json` is committed and is the only package-manager lockfile.
- Registry dependencies resolve through `registry.npmjs.org`.
- The manifests contain no `preinstall`, `install`, `postinstall`, or `prepare` lifecycle scripts.
- `@anderjason/textrange` restricts package contents to `dist` and `README.md` and declares public access explicitly.
- There is no automated CI or publishing workflow. This avoids adding a trusted automation surface before the project needs one.

## Dependency Changes

Treat every manifest or lockfile change as executable-code intake.

1. Review the manifest and lockfile diff, including sources, integrity values, lifecycle-script flags, and native packages.
2. Stop on unexpected registries, git dependencies, remote tarballs, or local file dependencies until they are reviewed and documented.
3. Start in an isolated environment with `npm ci --ignore-scripts`.
4. Inspect repository-local agent and editor automation before enabling scripts.
5. Run the checks below. Do not bypass a failure to complete an update.

## Checks

```sh
npm ci --ignore-scripts
npm audit signatures
npm audit --audit-level=high
npm run typecheck
npm test
npm run build
npm run pack:check
git diff --check
```

If a dependency needs an install script, review that package and the exact script before enabling it. Keep personal and publishing credentials out of the execution environment.

## Publishing

Before publishing `@anderjason/textrange`:

- audit npm package owners, MFA, existing tokens, and trusted-publisher relationships;
- use a clean isolated build environment;
- inspect `npm pack --dry-run` output;
- prefer npm Trusted Publishing with a human approval step;
- do not retain a long-lived npm publish token.

## Known Gaps

- The manifest does not pin an npm version or declare a Node version for development tooling.
- The repository has no release-age gate or automated source restrictions.
- Advisory and registry-signature checks are documented but not automated.
- GitHub dependency settings and npm account publishing controls cannot be verified from repository files.
- Package publishing remains blocked until the npm account and package controls above are reviewed.

## Expected Results

- Treat unexpected `npm audit signatures` verification failures as a stop condition.
- `npm audit --audit-level=high` fails when a high or critical advisory affects the locked dependency tree; review the advisory before changing dependencies.
- `npm ci --ignore-scripts` may leave a package unusable if it requires generated install artifacts. Review it before enabling scripts.
- `npm run pack:check` must list only intended package output and documentation.
