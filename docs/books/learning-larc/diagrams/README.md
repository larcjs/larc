# Learning LARC - Diagrams

This directory contains visual diagrams to help understand LARC concepts. All diagrams are created using Mermaid, which renders automatically in GitHub and most markdown viewers.

## Diagram Index

### Architecture & Concepts
- `01-architecture-overview.md` - High-level LARC architecture
- `02-component-structure.md` - Web Component anatomy
- `03-shadow-dom.md` - Shadow DOM encapsulation
- `04-component-lifecycle.md` - Lifecycle callback flow

### Communication & State
- `05-pan-bus.md` - PAN bus pub/sub patterns
- `06-state-management.md` - State management strategies
- `07-data-flow.md` - Data flow patterns

### Application Patterns
- `08-routing.md` - Client-side routing flow
- `09-form-flow.md` - Form submission flow
- `10-auth-flow.md` - Authentication flow
- `11-api-patterns.md` - API communication patterns

### Comparisons
- `12-traditional-vs-larc.md` - Framework comparison
- `13-build-vs-nobuild.md` - Build process comparison

### Real-World
- `14-app-architecture.md` - Complete application architecture
- `15-component-composition.md` - Component composition patterns

## How to View

### In GitHub
Diagrams render automatically when viewing `.md` files on GitHub.

### Locally
Use a markdown preview that supports Mermaid:
- VS Code: Install "Markdown Preview Mermaid Support" extension
- Obsidian: Built-in support
- Typora: Built-in support

### Generate Images
Use the Mermaid CLI to generate PNG/SVG:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram.md -o diagram.png
```

## Diagram Conventions

**Colors:**
- Blue (#667eea) - LARC components and concepts
- Green (#48bb78) - Success/positive flow
- Red (#f56565) - Errors/negative flow
- Gray (#4a5568) - External systems
- Purple (#764ba2) - User actions

**Shapes:**
- Rectangle - Components/elements
- Rounded rectangle - Processes/actions
- Diamond - Decisions
- Circle - Events
- Cylinder - Data stores
