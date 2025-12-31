# Introduction

*Building with LARC* is a comprehensive reference manual for the Lightweight Asynchronous Relay Core (LARC) framework. This book documents LARC's architecture, components, APIs, and patterns for experienced developers who need detailed technical reference material.

## Prerequisites

**This is a reference manual, not a tutorial.** Before using this book, you should:

1. **Read *Learning LARC* first** — The companion tutorial book teaches LARC concepts, architecture, and development patterns through hands-on examples.

2. **Have web development experience** — Familiarity with JavaScript (ES6+), HTML5, CSS3, Web Components, HTTP/REST APIs, and browser development tools.

3. **Understand LARC basics** — Core concepts (PAN bus, pub/sub messaging, component lifecycle) covered in *Learning LARC* Chapters 1-5.

If you're new to LARC, start with *Learning LARC*. This reference assumes you already know how to build LARC applications and need API documentation or implementation details.

## How to Use This Book

### As a Reference

Jump directly to chapters covering your current need:

- **Quick lookup**: Use Part I (Chapters 1-3) for architecture overview and configuration
- **Task-specific**: Part II (Chapters 4-16) covers specific features (state, routing, forms, etc.)
- **Component APIs**: Part III (Chapters 17-21) provides exhaustive component documentation
- **Quick reference**: Part IV (Appendices A-G) for message topics, patterns, glossary

### Book Structure

**Part I: Quick Reference** (Chapters 1-3)
- Architecture overview, message patterns, configuration options

**Part II: Feature Implementation** (Chapters 4-16)
- State management, routing, forms, APIs, authentication, real-time features, file management, theming, performance, testing, debugging, patterns, deployment

**Part III: Component Reference** (Chapters 17-21)
- Complete API documentation for core, data, UI, integration, and utility components

**Part IV: Appendices** (A-G)
- Message topics, event envelope spec, configuration, migration guide, recipes, glossary, resources

## Conventions

### Code Examples

**Inline code**: `component-name`, `attribute="value"`, `methodName()`

**Code blocks**:
```javascript
// JavaScript examples
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }
}
```

```html
<!-- HTML examples -->
<pan-card title="Example">
  <p>Content</p>
</pan-card>
```

**Command line**:
```bash
$ npm install @larcjs/core
$ python3 -m http.server 8000
```

The `$` is the shell prompt — don't type it.

### Typography

- **Bold**: New terms, emphasis, UI elements
- *Italic*: File names, URLs, emphasis
- `Constant width`: Code, commands, components, attributes

### Annotations

> **NOTE**: Additional context or clarification

> **WARNING**: Common mistakes or surprising behavior

> **TIP**: Practical advice from experience

### Message Topics

LARC uses hierarchical dot notation:

```
namespace.entity.action
```

Examples:

- `user.auth.login` — User login event
- `cart.items.add` — Add cart item
- `user.*` — Wildcard: all user events

See Appendix A for complete topic registry.

### Component Naming

- All lowercase with hyphens: `pan-button`, `pan-card`
- Core components use `pan-` prefix
- Custom components use your own prefix or none

### API Signatures

Type annotations for clarity (not actual TypeScript):

```javascript
publish(topic: string, payload: any, options?: object): void
```

TypeScript users: See `@larcjs/core-types` for official definitions.

## Relationship to *Learning LARC*

|  | Learning LARC | Building with LARC |
|--|---------------|-------------------|
| **Purpose** | Tutorial | Reference |
| **Audience** | Beginners | Experienced developers |
| **Style** | Narrative, progressive | Dense, lookup-focused |
| **Coverage** | Curated essentials | Comprehensive |
| **When to use** | Learning concepts | Building applications |

**New to LARC?** Complete *Learning LARC* before using this reference.

**Experienced?** This book is your primary resource.

**Learning specific features?** Check *Learning LARC* for tutorials, then this book for complete details.

## What's Next

- **Chapter 2**: Architecture overview and core concepts reference
- **Chapter 3**: Getting started — quick installation and setup
- **Chapters 4-16**: Task-specific implementation guides
- **Chapters 17-21**: Complete component API reference
- **Appendices**: Quick lookup tables and reference material

All examples available at `github.com/larcjs/building-with-larc-examples`
