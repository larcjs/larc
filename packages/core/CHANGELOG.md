# Changelog

## 2.1.0 (2024-12-31)

### Minor Changes

- **Bundle UI components for zero-config setup**
  - Added all 130 UI components to @larcjs/core/components/ directory
  - Updated autoloader to check ./components/ first for component resolution
  - Created automatic sync script to keep components in sync with @larcjs/ui
  - Enables one-line setup: `<script src="https://cdn.jsdelivr.net/npm/@larcjs/core@2.1.0/pan.mjs"></script>`
  - Components now auto-load without configuration
  - Maintains backward compatibility - existing code continues to work
  - Sync happens automatically during build and publish workflows

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
