# Chapter 1: Introduction

Welcome to *Building with LARC: A Reference Manual*, your comprehensive guide to the Lightweight Asynchronous Relay Core framework. If you're holding this book (or reading it on a screen, as modern humans do), you're about to dive into one of the most refreshingly simple yet surprisingly powerful approaches to building web applications. No, we're not overselling it. Well, maybe a little. But stick with us.

## What Is LARC?

LARC (Lightweight Asynchronous Relay Core) is a zero-build, browser-native web component framework built around a message-passing architecture called PAN (Page Area Network). If that sentence made you think "Wait, another JavaScript framework?" — we get it. But LARC is different in ways that matter.

Here's the elevator pitch: LARC gives you the power of modern component-based architecture without requiring build tools, dependency hell, or sacrificing your weekend to webpack configuration. It's built entirely on web standards (Custom Elements, Shadow DOM, ES Modules), uses a DOM-native pub/sub messaging system to coordinate components, and can be added to any project with a single `<script>` tag.

```html
<script type="module" src="/src/pan.mjs"></script>

<!-- That's it. You're done. Now use components: -->
<pan-card title="Hello World">
  <pan-button>Click me</pan-button>
</pan-card>
```

The secret sauce is the PAN bus — a lightweight messaging backbone inspired by the CAN (Controller Area Network) buses found in automobiles. Just as a car's sensors, motors, and computers communicate over a shared bus without knowing about each other's internals, LARC components coordinate through published messages and subscriptions. This solves the notorious "Web Component silo problem" where components can't easily communicate without tight coupling.

Think of it this way: Web Components give you 80% of what you need to build modern applications. LARC provides the missing 20% — the coordination layer, auto-loading system, and state management infrastructure that makes Web Components genuinely practical for real-world applications.

### The Philosophy in Action

LARC embraces a "zero-build development, optimized production" philosophy. During development, you write code and refresh your browser — no webpack watch, no hot-module replacement gymnastics, no waiting for recompilation. In production, you can still use your favorite build tools to optimize bundles, but you're not *required* to.

This isn't about being anti-tooling or nostalgic for the "good old days." Modern build tools solve real problems at scale. LARC simply argues they shouldn't be mandatory for every project, especially during the exploratory and iterative phases of development. The browser has evolved significantly since 2015 — it's time we trusted it to do what it does well.

## Who Should Use This Book

This book is written for **experienced programmers** who understand web development fundamentals and want a comprehensive reference for building applications with LARC. You should be comfortable with:

- **JavaScript** (ES6+): You know your promises from your async/await, understand modules, destructuring, and arrow functions. You don't need to be a TC39 committee member, but closures shouldn't make you nervous.

- **HTML and CSS**: You can write semantic markup and understand the box model. Shadow DOM will be explained, but the basics should be familiar territory.

- **Web Components**: Some exposure to Custom Elements and Shadow DOM is helpful but not required. We'll cover what you need, but won't re-teach the entire Web Components spec.

- **Basic HTTP and REST principles**: You know what GET and POST mean, understand APIs at a conceptual level, and have integrated with a backend before.

- **Command-line basics**: You can start a local development server (whether that's Python's `http.server`, Node's `http-server`, or something else) and navigate your file system.

### Who This Book Is NOT For

If you're completely new to web development, start with *Learning LARC* (more on that shortly). This reference manual assumes you already know how to build web applications and want to learn LARC specifically. We won't explain what the DOM is or why JavaScript runs in browsers.

Similarly, if you're looking for a gentle tutorial that holds your hand through your first "Hello World," the companion book *Learning LARC* is a better starting point. This manual is comprehensive, thorough, and occasionally exhausting in its detail — perfect for reference, less ideal for bedtime reading.

## How to Use This Book

*Building with LARC* is structured as a **reference manual**, not a tutorial. Think of it like the Perl Programming books or the classic O'Reilly references: comprehensive, authoritative, and designed for looking things up more than reading cover-to-cover (though you're welcome to try — we won't judge).

### Two Ways to Read

**As a Reference**: Jump directly to the chapter covering your current problem. Building a file management system? Chapter 14 has you covered. Need to implement authentication? Chapter 12 is your friend. Each chapter is relatively self-contained, with cross-references when deeper context is needed.

**As a Deep Dive**: Read Part I (Foundations) to understand LARC's philosophy and architecture, then work through Part II (Building Applications) in order to see how the pieces fit together. Part III (Component Reference) becomes your API documentation, and Part IV (Appendices) serves as quick-reference material.

### What's Inside

The book is organized into four parts:

**Part I: Foundations** (Chapters 1-5) covers the conceptual underpinnings: what LARC is, why it exists, how the PAN messaging architecture works, and how to set up your development environment. If you're new to LARC, read this first.

**Part II: Building Applications** (Chapters 6-20) is where the rubber meets the road. These task-oriented chapters show you how to accomplish specific goals: managing state, handling routing, fetching data, implementing authentication, optimizing performance, and deploying to production. Each chapter follows a consistent structure: problem statement, concepts, step-by-step implementation, complete example, variations, troubleshooting, and best practices.

**Part III: Component Reference** (Chapters 21-25) provides exhaustive documentation for every core LARC component. Think of it as your API reference — detailed attribute tables, method signatures, event specifications, and practical examples for components like `pan-bus`, `pan-store`, `pan-routes`, `pan-markdown-editor`, and dozens more.

**Part IV: Appendices** (A-G) contains supporting material: message topic conventions, event envelope specifications, configuration options, migration guides, code recipes, a glossary, and resource links.

### Code Conventions

Throughout this book, you'll see code examples in various formats:

**Inline code** appears `like this` for short snippets, commands, file names, and HTML attributes.

**Block code** appears in fenced sections with syntax highlighting:

```javascript
// JavaScript examples look like this
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.textContent = 'Hello from LARC!';
  }
}
```

```html
<!-- HTML examples look like this -->
<pan-card title="Example">
  <p>Component content goes here</p>
</pan-card>
```

**File paths** are shown in UNIX format (`/src/components/my-component.mjs`) but translate naturally to Windows (`\src\components\my-component.mjs`).

**Command-line examples** begin with a prompt:

```bash
$ python3 -m http.server 8000
$ npm install @larcjs/core
```

The `$` indicates your shell prompt — don't type it.

### Typographical Conventions

This book uses standard O'Reilly conventions:

- **Bold** indicates new terms, emphasis, or UI elements ("click the **Save** button")
- *Italic* indicates filenames, URLs, example text, or emphasis
- `Constant width` indicates code, commands, component names, attributes, and technical terms

We also use special elements to highlight important information:

> **NOTE**: Additional context, clarifications, or interesting tangents that won't break your code if you skip them.

> **WARNING**: Pay attention here — this is where developers commonly make mistakes or encounter surprising behavior.

> **TIP**: Practical advice from the trenches, often learned the hard way.

## Relationship to "Learning LARC"

If *Building with LARC* is the comprehensive reference manual, *Learning LARC* is its approachable older sibling — the tutorial-focused book that teaches LARC from the ground up through hands-on examples and clear explanations.

The two books complement each other:

**Learning LARC** (the tutorial book) is organized around **learning progressions**. It starts with "Hello World" and gradually builds to complex, real-world applications. Each chapter introduces new concepts in a carefully scaffolded way, with exercises, quizzes, and projects that reinforce understanding. If you're new to LARC or prefer learning by doing, start there.

**Building with LARC** (this book) is organized around **tasks and references**. It assumes you already understand the basics and want to accomplish specific goals or look up specific component APIs. It's comprehensive where *Learning LARC* is curated, exhaustive where the tutorial is selective, and reference-oriented where the tutorial is narrative-driven.

Here's a practical guideline:

- **New to LARC?** Start with *Learning LARC*, then return to this book for reference and advanced topics.

- **Experienced with LARC?** This book is your primary resource. Keep it on your desk (or bookmarked in your browser).

- **Learning a specific feature?** Check *Learning LARC* for tutorial coverage, then consult this book's relevant chapters for comprehensive details.

- **Debugging or optimizing?** This book's troubleshooting sections, appendices, and detailed component references are what you need.

Think of it like the difference between *Learning Perl* and *Programming Perl* — one teaches you the language, the other documents it thoroughly. Both are valuable, just at different times.

## Prerequisites and Assumptions

To get the most from this book, you should have:

### Required Knowledge

1. **JavaScript Fundamentals**: You're comfortable with modern JavaScript (ES6+), including modules, async/await, destructuring, template literals, and arrow functions. You understand scope, closures, and prototypes at least conceptually.

2. **Web Development Basics**: You've built websites or web applications before. You understand client-server architecture, HTTP methods, and how browsers request resources.

3. **HTML/CSS**: You can write semantic HTML5 and know enough CSS to style components. You don't need to be a design wizard, but you should understand selectors, specificity, and layout basics.

4. **Development Environment**: You can set up a local development server and use a code editor. Experience with browser DevTools (Console, Network, Elements tabs) is highly recommended.

### Helpful But Not Required

- **TypeScript**: LARC supports TypeScript with official type definitions (`@larcjs/core-types`), but JavaScript examples are used throughout this book for clarity and accessibility.

- **Build Tools**: While LARC is designed for zero-build development, understanding webpack, Rollup, or Vite helps when you want optimized production builds.

- **React/Vue/Angular**: Experience with component-based frameworks provides useful context for understanding LARC's architecture, but isn't necessary.

- **Web Components APIs**: We'll explain what you need about Custom Elements, Shadow DOM, and HTML Templates, but prior exposure helps.

### What You Don't Need

You **don't** need to know:

- Advanced computer science algorithms or data structures
- Backend programming (though integration examples are provided)
- DevOps or deployment infrastructure (basics are covered in Chapter 20)
- Browser internals or JavaScript engine implementations

This book meets you where experienced web developers typically are — comfortable with the fundamentals and ready to learn a new tool.

### Software Requirements

Throughout this book, examples assume you have:

- A **modern web browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+. Most examples work across all modern browsers, but specific features may note browser requirements.

- A **local development server**: Any static file server works. Examples use Python's built-in HTTP server, but Node's `http-server`, PHP's built-in server, or VS Code's Live Server extension are equally valid.

- A **code editor**: VS Code is recommended (with the LARC extension for enhanced support), but any editor with JavaScript/HTML syntax highlighting works.

- **Git** (optional): Useful for cloning examples and exploring the LARC source code.

No build tools, no Node.js, no npm (unless you want to install LARC from npm) — just a browser and a way to serve static files. That's the point.

## Book Conventions and Notation

### Message Topics

LARC applications communicate through the PAN bus using hierarchical topic patterns. Throughout this book, topics follow conventions:

```
namespace.entity.action
```

For example:

- `user.auth.login` — User authentication login
- `cart.items.add` — Add item to shopping cart
- `theme.changed` — Theme change notification

Wildcards are common:

- `user.*` — All user-related messages
- `*.changed` — All change notifications
- `#` — All messages (use sparingly)

### Component Naming

LARC components follow Web Component naming conventions:

- All lowercase with hyphens: `pan-button`, `pan-card`, `my-custom-component`
- Must contain at least one hyphen (per Web Component spec)
- Core LARC components start with `pan-` prefix
- Your components can use any prefix or no prefix

### Attribute Syntax

Component attributes are shown in HTML as:

```html
<pan-card
  title="Card Title"
  variant="elevated"
  theme="dark">
```

Boolean attributes (true when present, false when absent):

```html
<pan-button disabled>Can't click me</pan-button>
<pan-markdown-editor readonly></pan-markdown-editor>
```

### API Signatures

JavaScript APIs are documented with type annotations for clarity:

```javascript
// Method signature
publish(topic: string, payload: any, options?: object): void

// Usage example
bus.publish('user.login', { userId: 123 });
```

These aren't real TypeScript — just pseudocode for clarity. TypeScript users should reference the official `@larcjs/core-types` package for actual type definitions.

### File Paths and Imports

Example projects use a consistent structure:

```
/src/
  /components/     # Your custom components
  /utils/          # Helper functions
  /styles/         # Global styles
/core/             # LARC core (@larcjs/core)
/ui/               # LARC components (@larcjs/components)
index.html         # Entry point
larc-config.mjs    # Path configuration
```

Imports use ES6 module syntax:

```javascript
import { PanBus } from '/core/src/pan-bus.mjs';
import MyComponent from '/src/components/my-component.mjs';
```

Production applications typically use import maps or CDN URLs (covered in Chapter 20).

### Example Applications

Each chapter includes complete, runnable examples. You can:

1. **Type them manually** — Best for learning and retention
2. **Copy from the book** — Faster, still educational
3. **Clone from GitHub** — All examples are available at `github.com/larcjs/examples`

Examples are self-contained where possible, with any dependencies clearly noted.

## What's Next

Now that you understand what LARC is, who this book is for, and how to use it effectively, you're ready to dive deeper. Chapter 2 explores the philosophy behind LARC — why message-passing architecture, why zero-build, and how LARC compares to other approaches. Understanding the "why" makes the "how" much clearer.

If you prefer learning by doing, feel free to skip ahead to Chapter 5 (Getting Started) and return to the philosophical foundations later. We won't tell anyone.

If you're the type who needs to understand principles before touching code (guilty), Chapter 2 awaits.

Either way, welcome to LARC. We think you're going to like it here.

---

*"The web grew up. Now we get to build like it."*
— Christopher Robison, Foreword to *Learning LARC*
