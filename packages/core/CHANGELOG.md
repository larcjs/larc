# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **🔥 Dynamic Message Routing** - Runtime-configurable routing system for declarative event-driven architectures
  - Match messages by type, topic, tags, source, or complex predicates (eq, neq, gt, lt, in, regex, and, or, not)
  - Transform messages with pick, map, or custom transformation functions
  - Execute actions: EMIT (publish new messages), FORWARD (reroute), LOG (with templates), CALL (custom handlers)
  - Add, update, remove, enable/disable routes at runtime via API or control messages
  - Route ordering, change listeners, error handlers, and performance statistics
  - Comprehensive routing documentation (`docs/ROUTING.md`) with real-world examples
- Routing test suite with 20 tests covering route management, message matching, actions, control messages, statistics, and integration
- Export `pan-routes` component from package.json for direct import
- Routing showcase in README with compelling use cases (analytics, notifications, feature flags, data enrichment)

### Changed
- Exposed `window.pan.routes` for easy access to routing manager
- Updated README features list to include Dynamic Routing

## [1.1.0] - 2024-01-XX

### Added
- Comprehensive test suite with 335 tests across 5 browsers (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
- GitHub Actions CI/CD workflows for automated testing and publishing
- Automated cross-browser testing on every push and pull request
- Code coverage reporting with Codecov integration
- GitHub Actions and Codecov status badges in README

### Fixed
- Fixed 3 flaky autoloader tests by adding proper async waits for pan-bus initialization
- Fixed race conditions in component autoloading during tests

### Changed
- Improved test reliability with proper async handling in autoloader tests
- Enhanced CI/CD infrastructure for automated npm publishing with provenance

## [1.0.2] - 2024-XX-XX

### Added
- Routing system and debug manager
- Comprehensive testing infrastructure

### Fixed
- PAN bus delivery to support document listeners with bubbles/composed
- Repository URL format

### Changed
- Updated messaging and positioning of project

## [1.0.1] - 2024-XX-XX

### Fixed
- Bug fixes and path corrections for apps migration
- Removed duplicate pan-bus-enhanced registration

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of LARC Core
- PAN (Page Area Network) messaging bus implementation
- `<pan-bus>` and `<pan-client>` web components
- Pub/sub, request/reply, and retained message patterns
- Cross-tab communication support
- Zero-build development workflow
- Component autoloading system
