# Changelog

All notable changes to the LARC project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

> These items are complete on `main` and will ship in **v3.1.0** once the packages are published to npm.

### Added
- Site-wide **dark mode** with persisted theme preference across docs, playground, and demo apps
- **Unified playground** experience (Gallery, Builder, Editor modes) so users can try components without cloning the repo
- **Hybrid dashboard refresh** demonstrating React + Vue + LARC components on one page

### Changed
- README, launch playbooks, and FAQ now reflect the real **426-browser-test** matrix and the current **3.6KB** core bundle size
- CI summaries were corrected to match the actual Node/browsers we run today (Linux + macOS, Node 22)

### Fixed
- Updated links that previously pointed to `hybrid-dashboard.html` so they no longer 404 when shared on HN/Reddit

## [3.0.2] - 2026-11-10

Patch release fixing two delivery/lifecycle bugs in the PAN bus and client. **No breaking changes.**
Fixed in every shipped bus/client variant: `@larcjs/core` (`index.js`, `pan-bus.mjs`, `pan-bus-lite.mjs`,
`pan-client.mjs`, `components/pan-bus-enhanced.mjs`, `components/pan-bus-legacy.mjs`),
`@larcjs/core-lite`, and the `@larcjs/core-types` / enhanced-bus type definitions.

### Fixed
- **Messages leaked between subscriptions that share a host element.** Every `pan:deliver` listener on a
  host used to receive every delivery for that host, so with N matching subscriptions each handler ran N
  times per message, and retained replay for one subscription also ran the handlers of the others.
  Each subscription now has a unique id (`subId`, sent in `pan:subscribe`); the bus tags deliveries with it
  (`event.panSubId`, `event.detail` unchanged) and `PanClient` ignores other subscriptions' deliveries.
  - Each subscription gets each matching message exactly once, including when one subscription lists
    several matching patterns.
  - Retained replay goes only to the new subscription.
  - `pan:unsubscribe` with a `subId` removes only that subscription (two subscriptions from one client to
    the same pattern no longer remove each other).
  - Apps no longer need a hidden element per subscription as a workaround.
- **The bus's client list grew forever, and subscriptions on removed elements were never pruned.**
  - New `PanClient.dispose()`: unsubscribes everything and sends a new `pan:bye` event (`{ id }`); the bus
    drops the client and all of its subscriptions. Safe to call twice. Web components should call it
    in `disconnectedCallback`.
  - The bus now prunes subscriptions and clients whose host `Element` is disconnected. This runs at
    delivery time only, so an element moved within the DOM in the same task keeps its subscriptions
    (trade-off: a message published while a host is detached drops that host's subscriptions).
    `document` is never pruned.
  - `pan:hello` re-sent with an existing client id updates the entry in place.

### Added
- `PanClient.dispose()`, the `pan:bye` event, the `subId` field on `pan:subscribe` / `pan:unsubscribe`, and
  `event.panSubId` on `pan:deliver`, with TypeScript definitions (`PanSubscribeDetail`, `PanByeDetail`,
  `PanDeliverEvent`, `Subscription.subId`, `PanBus.subs` / `clients`).

### Compatibility
- A `pan:subscribe` event **without** a `subId` (older clients, hand-written events) behaves exactly as before.
- A new client on an older bus keeps working: deliveries without `panSubId` fall back to the previous
  pattern filtering (an older bus still sends duplicates; upgrade the bus to get exactly-once delivery).
- Topic matching is unchanged (`*` matches one dot-segment; a bare `*` matches everything).
- Minified size impact: `@larcjs/core` `index.js` +983 B (4337 → 5320 B; gzip +363 B);
  `@larcjs/core-lite` bus + client +1092 B (5041 → 6133 B; gzip +418 B).

### Testing
- 54 new regression tests (9 scenarios × 6 bus/client variants) in `packages/core/tests/regression/`.

## [3.0.1] - 2025-01-05

### Changed
- **Version Synchronization:** All packages now at v3.0.1 for consistency
  - Previously: @larcjs/core at 2.1.0, others at 3.0.0
  - Now: All @larcjs/* packages synchronized to 3.0.1
  - **No breaking changes** - purely organizational release

### Security
- Fixed 4 CodeQL security alerts
  - Incomplete multi-character sanitization in pan-jwt.mjs
  - DOM text reinterpreted as HTML in pan-json-form.mjs and pan-inspector.mjs

### Testing
- All 426 tests passing (261 core + 165 UI) across Chromium, Firefox, WebKit
- GitHub Actions CI/CD workflows operational

## [3.0.0] - 2024-12-01

### Added - Ecosystem Expansion

#### CLI Tooling
- **create-larc-app** - Project scaffolding tool for creating new LARC applications
  - Interactive project creation with multiple templates
  - Zero-config setup with automatic dependency installation
  - Git initialization and project structure generation
- **larc CLI** - Development tooling suite
  - `larc dev` - Hot-reload development server with SSE-based HMR
  - `larc add` - Component installation from registry
  - `larc generate` - Code generation for new components
  - `larc preview` - Production preview server
- Project templates (minimal, with plans for dashboard and blog)

#### Component Registry
- Web-based component discovery and browsing interface
- JSON Schema-based component metadata system
- Quality scoring and verification badges
- Registry build and validation tools
- Component submission workflow for community contributions
- Example components (pan-card, pan-button)

#### VS Code Extension
- Code snippets for LARC components and PAN bus patterns
- IntelliSense with component auto-completion
- Registry integration for browsing and installing components
- Commands for creating and managing components
- Configuration settings for customization

#### Documentation
- Learning LARC guide with chapters and diagrams
- Component registry documentation (README, CONTRIBUTING)
- CLI tool documentation and usage guides
- VS Code extension documentation
- Implementation completion summary
- Hacker News launch checklist

#### Community & Governance
- CODE_OF_CONDUCT.md - Contributor Covenant Code of Conduct
- CONTRIBUTING.md - Comprehensive contributing guidelines
- SECURITY.md - Security policy and vulnerability reporting process

### Changed

#### Component Registry Updates
- Updated component paths from `@larcjs/ui` to `@larcjs/ui`
- Regenerated component registry with latest component discoveries
- Added 8 new components to registry:
  - `pan-computed-state` - Derived state management
  - `pan-json-form` - JSON-based form generation
  - `pan-offline-sync` - Offline-first synchronization
  - `pan-persistence-strategy` - Storage strategy management
  - `pan-schema-validator` - JSON Schema validation
  - `pan-state-sync` - Cross-tab state synchronization
  - `pan-tree` - Tree view component
  - `pan-undo-redo` - Undo/redo state management

#### Repository Structure
- Added `/cli` directory for CLI tooling
- Added `/registry` directory for component registry
- Added `/vscode-extension` directory for VS Code extension
- Added `/docs/books/learning-larc` directory for learning materials
- Added `registry-schema.json` for component metadata validation

#### Documentation Updates
- Updated main README with ecosystem tools section
- Enhanced Quick Start with CLI-first approach
- Added three quick start options (CLI, automated, manual)
- Updated repository table with ecosystem tool references

### Fixed
- Submodule SSH connection issues by converting to HTTPS URLs
- Component path references in playground registry

## [1.1.1] - 2024-11-28

### Core (@larcjs/core)
- Published version 1.1.1 with bug fixes and improvements
- All 261 tests passing across Chromium, Firefox, and WebKit

### Components (@larcjs/ui)
- Published version 1.1.0 with new state management components
- Enhanced state management suite with cross-tab sync, offline support, and validation

### Types
- @larcjs/core-types version 1.1.1
- @larcjs/ui-types version 1.0.2

## [1.1.0] - 2024-11-20

### Added
- Comprehensive state management components
- Advanced state synchronization features
- Offline-first capabilities
- Enhanced developer tooling

### Documentation
- Development philosophy documentation
- Production roadmap
- State management patterns guide
- Browser compatibility matrix

## [1.0.0] - 2024-11-01

### Added
- Initial release of LARC framework
- PAN (Page Area Network) messaging bus
- Auto-loading system for web components
- Configuration system for path management
- TypeScript support
- Interactive playground
- Core component library
- Documentation website

### Features
- Zero-build development workflow
- Framework-agnostic component system
- Cross-tab state synchronization
- Progressive component loading
- CDN-ready architecture
- Wide browser support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## Version History

- **Unreleased / v3.1.0** (2026-02-25) - Unified playground, dark mode, refreshed launch collateral
- **3.0.2** (2026-11-10) - Fix delivery leaks between subscriptions sharing a host; add `dispose()` / `pan:bye` and pruning
- **3.0.1** (2025-01-05) - Version synchronization + CodeQL fixes (this repo)
- **3.0.0** (2024-12-01) - Ecosystem expansion (CLI, Registry, VS Code extension)
- **1.1.1** (2024-11-28) - Bug fixes and stability improvements
- **1.1.0** (2024-11-20) - State management enhancements
- **1.0.0** (2024-11-01) - Initial release

[Unreleased]: https://github.com/larcjs/larc/compare/v3.0.2...HEAD
[3.0.2]: https://github.com/larcjs/larc/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/larcjs/larc/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/larcjs/larc/compare/v1.1.1...v3.0.0
[1.1.1]: https://github.com/larcjs/larc/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/larcjs/larc/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/larcjs/larc/releases/tag/v1.0.0
