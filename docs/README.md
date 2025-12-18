# LARC Documentation

This directory contains all documentation for the LARC project.

## Directory Structure

```
docs/
├── README.md              # This file
├── CHANGELOG.md           # Project changelog
│
├── guides/                # User-facing how-to guides
│   ├── QUICK-START.md     # Getting started guide
│   ├── MIGRATION.md       # Migration guide
│   ├── TROUBLESHOOTING.md # Common issues and solutions
│   ├── PACKAGES.md        # Package documentation
│   └── BUILD-PROCESS.md   # Build system guide
│
├── reference/             # API & Technical reference
│   ├── API-REFERENCE.md   # Complete API documentation
│   ├── API-STABILITY.md   # API stability commitments
│   ├── STATE-MANAGEMENT.md# State management patterns
│   ├── PERFORMANCE-OPTIMIZATION.md
│   └── BROWSER-COMPATIBILITY.md
│
├── specs/                 # Specifications
│   └── SEMVER.md          # Semantic versioning policy
│
├── roadmap/               # Project planning
│   ├── PLAN.md            # Current development plan
│   ├── DEVELOPMENT-PLAN.md
│   └── PRODUCTION_ROADMAP.md
│
├── books/                 # Long-form documentation
│   ├── learning-larc/     # Tutorial-style book
│   └── building-with-larc/# Comprehensive reference manual
│
├── processes/             # Internal development processes
│   ├── LAUNCH_CHECKLIST.md
│   ├── SUBMODULE-WORKFLOW.md
│   └── ...
│
├── migration/             # Migration-related docs
│
├── site/                  # Documentation website source
│
└── archive/               # Historical status files
    └── 2024/              # Archived 2024 session notes
```

## Books

### Learning LARC
A narrative, tutorial-style introduction to LARC. Start here if you're new.
- Location: `books/learning-larc/`
- Build: `cd books/learning-larc && ./build-book.sh`

### Building with LARC
A comprehensive technical reference manual. Use this as a desk reference.
- Location: `books/building-with-larc/`
- Build: `cd books/building-with-larc && ./build-book.sh`

## Quick Links

- **Getting Started**: [guides/QUICK-START.md](guides/QUICK-START.md)
- **API Reference**: [reference/API-REFERENCE.md](reference/API-REFERENCE.md)
- **Migration Guide**: [guides/MIGRATION.md](guides/MIGRATION.md)
- **Troubleshooting**: [guides/TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md)

## Contributing to Documentation

1. User-facing guides go in `guides/`
2. Technical reference goes in `reference/`
3. Specifications go in `specs/`
4. Planning documents go in `roadmap/`
5. Historical/status files go in `archive/YYYY/`

Please follow the existing naming conventions (UPPERCASE-WITH-DASHES.md).
