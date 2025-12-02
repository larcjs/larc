# Contributing to LARC Component Registry

Thank you for your interest in contributing to the LARC ecosystem! This guide will help you submit your component to the registry.

## 📋 Before You Start

### Component Checklist

- [ ] Component is published on npm
- [ ] Component name follows kebab-case (e.g., `my-component`)
- [ ] README with usage examples
- [ ] MIT-compatible license
- [ ] Follows web component standards
- [ ] Works without build tools
- [ ] No breaking CORS issues

### Recommended (for higher quality score)

- [ ] TypeScript type definitions
- [ ] Unit tests (Jest, Vitest, Web Test Runner, etc.)
- [ ] Live demo page
- [ ] Multiple usage examples
- [ ] PAN bus integration
- [ ] Accessibility features
- [ ] Documentation site

## 🚀 Submission Process

### Step 1: Publish to npm

Your component must be available on npm before submitting to the registry.

```bash
# In your component directory
npm publish
```

**Package name conventions:**
- Scoped: `@username/component-name` (recommended)
- Unscoped: `larc-component-name` (must start with `larc-`)

### Step 2: Fork the Registry

```bash
git clone https://github.com/larcjs/registry.git
cd registry
git checkout -b add-my-component
```

### Step 3: Create Component Entry

Create a file in `components/` named after your component:

```bash
# Example: components/my-awesome-widget.json
```

Use this template:

```json
{
  "name": "my-awesome-widget",
  "displayName": "Awesome Widget",
  "description": "A brief, clear description of what your component does",
  "category": "ui",
  "icon": "🎨",
  "tags": ["ui", "widget", "awesome"],
  "status": "stable",
  "since": "1.0.0",

  "npm": {
    "package": "@username/my-awesome-widget",
    "version": "1.0.0",
    "url": "https://www.npmjs.com/package/@username/my-awesome-widget"
  },

  "cdn": {
    "jsdelivr": "https://cdn.jsdelivr.net/npm/@username/my-awesome-widget@1.0.0/dist/index.js",
    "unpkg": "https://unpkg.com/@username/my-awesome-widget@1.0.0/dist/index.js",
    "esm": "https://esm.sh/@username/my-awesome-widget@1.0.0"
  },

  "repository": {
    "type": "github",
    "url": "https://github.com/username/my-awesome-widget"
  },

  "demo": "https://username.github.io/my-awesome-widget",

  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://yoursite.com",
    "github": "username"
  },

  "license": "MIT",

  "panTopics": [
    "widget:update",
    "widget:close",
    "data:widget"
  ],

  "attributes": [
    {
      "name": "color",
      "type": "string",
      "default": "blue",
      "description": "The color of the widget",
      "required": false
    },
    {
      "name": "size",
      "type": "string",
      "default": "medium",
      "description": "Widget size: small, medium, or large",
      "required": false
    }
  ],

  "properties": [
    {
      "name": "isOpen",
      "type": "boolean",
      "description": "Whether the widget is currently open",
      "readonly": false
    }
  ],

  "methods": [
    {
      "name": "toggle",
      "description": "Toggle the widget open/closed state",
      "parameters": [],
      "returns": {
        "type": "void"
      }
    }
  ],

  "events": [
    {
      "name": "widget-change",
      "description": "Fired when widget state changes",
      "detail": {
        "type": "{ isOpen: boolean }",
        "description": "Contains the new state"
      }
    }
  ],

  "slots": [
    {
      "name": "default",
      "description": "Main content slot"
    },
    {
      "name": "header",
      "description": "Optional header content"
    }
  ],

  "cssProperties": [
    {
      "name": "--widget-bg",
      "description": "Background color",
      "default": "#ffffff"
    }
  ],

  "cssParts": [
    {
      "name": "container",
      "description": "Main container element"
    }
  ],

  "examples": [
    {
      "title": "Basic Usage",
      "description": "Simple widget with default settings",
      "code": "<my-awesome-widget color=\"blue\">Content</my-awesome-widget>"
    },
    {
      "title": "With Custom Styles",
      "description": "Using CSS custom properties",
      "code": "<my-awesome-widget style=\"--widget-bg: #f0f0f0\">Styled content</my-awesome-widget>"
    }
  ],

  "dependencies": [
    "@larcjs/core"
  ],

  "related": [
    "other-component"
  ],

  "quality": {
    "tests": true,
    "types": true,
    "docs": true,
    "examples": true
  }
}
```

### Step 4: Validate Your Entry

```bash
npm install
npm run validate
```

This checks:
- JSON syntax
- Required fields
- Schema compliance
- npm package exists
- URLs are accessible

### Step 5: Submit Pull Request

```bash
git add components/my-awesome-widget.json
git commit -m "Add my-awesome-widget component"
git push origin add-my-component
```

Then open a PR on GitHub with:

**Title:** `Add [component-name] component`

**Description:**
```markdown
## Component Information

- **Name**: my-awesome-widget
- **Category**: UI Components
- **NPM**: [@username/my-awesome-widget](https://www.npmjs.com/package/@username/my-awesome-widget)
- **Demo**: [View Demo](https://username.github.io/my-awesome-widget)

## Description

Brief description of what your component does and why it's useful.

## Checklist

- [x] Component published on npm
- [x] README with examples
- [x] MIT license
- [x] JSON validated
- [x] Demo available
- [x] Tests included
- [x] TypeScript types included

## Screenshots

![Component Preview](https://your-image-url.png)
```

## 📐 Component Guidelines

### Naming

✅ **Good:**
- `user-card`
- `data-table`
- `pan-custom-widget`

❌ **Bad:**
- `UserCard` (not lowercase)
- `card` (needs hyphen)
- `my_component` (use hyphen, not underscore)

### Categories

Choose the most appropriate category:

- **routing** - Navigation, routing, links
- **state** - State management, storage
- **forms** - Form inputs, validation
- **data** - Data fetching, APIs, connectors
- **ui** - Visual components, layouts
- **content** - Content display, editors
- **auth** - Authentication, security
- **theme** - Theming, styling
- **devtools** - Development utilities
- **advanced** - Complex/specialized components

### Status Levels

- **experimental** - Early development, API may change
- **beta** - Feature complete, stabilizing API
- **stable** - Production ready, stable API
- **deprecated** - No longer recommended

### PAN Topics

Document all PAN bus topics your component uses:

```json
"panTopics": [
  "user:login",      // Listens for login events
  "user:logout",     // Listens for logout events
  "nav:change"       // Publishes navigation changes
]
```

Use wildcards for topic families:
```json
"panTopics": [
  "widget:*",        // All widget topics
  "data:products:*"  // All product data topics
]
```

### Documentation

Your npm package README should include:

1. **Installation** - npm install and CDN usage
2. **Quick Start** - Basic usage example
3. **API** - All attributes, properties, methods, events
4. **Examples** - Multiple usage scenarios
5. **Styling** - CSS variables and parts
6. **PAN Bus** - Topics used for communication

### Code Quality

Your component should:

- ✅ Use standard Web Components API
- ✅ Work without build tools (native ES modules)
- ✅ Handle errors gracefully
- ✅ Clean up resources (event listeners, timers)
- ✅ Follow accessibility best practices
- ✅ Be responsive
- ✅ Not pollute global scope

### Testing

Include tests for:

- Component initialization
- Attribute changes
- Method functionality
- Event firing
- PAN bus integration
- Error cases

## 🏆 Quality Score

Components are scored A-F based on:

### Grade A (90-100 points)
- ✅ Comprehensive tests (25 pts)
- ✅ TypeScript definitions (20 pts)
- ✅ Detailed documentation (20 pts)
- ✅ Multiple examples (15 pts)
- ✅ Live demo (10 pts)
- ✅ Accessibility (10 pts)

### Grade B (75-89 points)
- ✅ Basic tests
- ✅ TypeScript definitions
- ✅ Good documentation
- ✅ Some examples

### Grade C (60-74 points)
- ✅ Documentation
- ✅ Basic examples

### Grade D (50-59 points)
- ✅ Minimal documentation

### Grade F (<50 points)
- ❌ Missing documentation

## 🔍 Review Process

After submitting your PR:

1. **Automated checks** run (JSON validation, linting)
2. **Manual review** by LARC team member
3. **Feedback** provided if changes needed
4. **Approval** and merge when ready
5. **Registry update** (usually within 24 hours)

### What We Check

- ✅ Component works as described
- ✅ No security vulnerabilities
- ✅ Follows web standards
- ✅ Documentation is accurate
- ✅ Examples work
- ✅ No copyright violations

## 🔄 Updating Your Component

To update your component entry:

1. Update your npm package
2. Submit PR updating the JSON file
3. Update version numbers
4. Add changelog notes

## ❓ Questions?

- 💬 [Discord Community](https://discord.gg/larc)
- 📧 Email: components@larcjs.com
- 📝 [Open an Issue](https://github.com/larcjs/registry/issues)

## 📄 License

By contributing, you agree that your component listing is licensed under MIT.

## 🎉 Thank You!

Your contributions make LARC better for everyone!
