# Appendix G: Resources

This appendix provides a curated collection of resources for learning, using, and extending LARC. Whether you're getting started, troubleshooting a problem, or contributing to the ecosystem, these links will help you find what you need.

## Official Documentation

### Primary Documentation

**LARC Core Repository**
https://github.com/larcjs/larc
The main LARC repository containing the core framework source code, examples, and technical documentation. This is the authoritative source for implementation details and includes the complete test suite.

**LARC Components Library**
https://github.com/larcjs/components
Official component library with production-ready UI components, data components, integration components, and utilities. Each component includes comprehensive documentation and working examples.

**API Reference**
https://larcjs.org/api
Complete API documentation for all core classes, components, and utilities. Includes type definitions, method signatures, and interactive examples.

**Getting Started Guide**
https://larcjs.org/getting-started
Quick-start guide for new developers. Walks through installation, first application, and core concepts in 30 minutes.

### Companion Books

**Learning LARC**
The tutorial-focused companion to this reference manual. Organized around progressive learning with hands-on exercises, projects, and quizzes. Ideal for developers new to LARC or component-based architecture.

**Building with LARC: A Reference Manual**
This book. Comprehensive reference covering all aspects of LARC development from core concepts to advanced patterns. Available online at https://larcjs.org/reference

## Community Resources

### Forums and Discussion

**LARC Discussions (GitHub)**
https://github.com/larcjs/larc/discussions
Official discussion forum for LARC developers. Ask questions, share projects, discuss patterns, and connect with other developers. Monitored by core maintainers.

**Stack Overflow**
https://stackoverflow.com/questions/tagged/larc
Tag: `larc`
For technical troubleshooting and specific programming questions. Search existing questions before posting new ones.

**Discord Community**
https://discord.gg/larcjs
Real-time chat for LARC developers. Channels for beginners, advanced topics, component development, and off-topic discussion. Most active community hub.

**Reddit r/larcjs**
https://reddit.com/r/larcjs
Community-run subreddit for LARC news, showcases, and discussion. Good for project feedback and ecosystem updates.

### Social Media

**Twitter/X: @larcjs**
https://twitter.com/larcjs
Official Twitter account for announcements, tips, and community highlights. Follow for news about releases, events, and ecosystem updates.

**Mastodon: @larcjs@fosstodon.org**
https://fosstodon.org/@larcjs
Official presence on the Fediverse for developers who prefer open platforms.

**LinkedIn: LARC Developers Group**
https://linkedin.com/groups/larcjs
Professional network for LARC developers. Good for job postings, industry discussion, and enterprise use cases.

## Code Examples and Templates

### Example Applications

**Official Examples Repository**
https://github.com/larcjs/examples
Curated collection of example applications demonstrating LARC patterns and components. Each example is self-contained, documented, and includes setup instructions.

Notable examples include:

- Task Manager (state management, persistence)
- E-commerce Store (routing, forms, authentication)
- Real-time Chat (WebSocket integration, presence)
- File Manager (OPFS, drag-and-drop, uploads)
- Dashboard Builder (composable widgets, theming)

**CodeSandbox Templates**
https://codesandbox.io/search?refinementList%5Btags%5D=larc
Interactive online templates for rapid prototyping. Fork and experiment without local setup. Includes starter templates for common application types.

**GitHub Topics: #larcjs**
https://github.com/topics/larcjs
Community-contributed projects using LARC. Browse for inspiration, study real-world implementations, and discover reusable components.

### Component Showcases

**LARC Component Gallery**
https://components.larcjs.org
Visual gallery of all official components with live demos, code samples, and customization tools. Essential reference when choosing components for your project.

**Awesome LARC Components**
https://github.com/larcjs/awesome-larc-components
Curated list of community-built components. Organized by category (UI, data, integration) with quality ratings and maintenance status.

## Development Tools

### Browser Extensions

**LARC DevTools**
Chrome: https://chrome.google.com/webstore/detail/larc-devtools
Firefox: https://addons.mozilla.org/firefox/addon/larc-devtools
Browser extension providing visual PAN message inspection, component tree visualization, performance profiling, and state debugging.

**Web Components DevTools**
General-purpose extension for debugging all Web Components, including LARC components. Useful for inspecting Shadow DOM and custom element lifecycles.

### Editor Extensions

**VS Code: LARC Extension**
https://marketplace.visualstudio.com/items?itemName=larcjs.larc-vscode
Official VS Code extension providing:

- Component auto-completion
- PAN topic IntelliSense
- Snippet library for common patterns
- Integrated component browser
- Live component preview

**JetBrains Plugin: LARC Support**
https://plugins.jetbrains.com/plugin/larcjs-support
Support for WebStorm, IntelliJ IDEA, and other JetBrains IDEs. Provides code completion, navigation, and refactoring tools.

### Command-Line Tools

**LARC CLI**
https://github.com/larcjs/cli
```bash
$ npm install -g @larcjs/cli
```
Official command-line interface for:

- Project scaffolding (`larc create`)
- Component generation (`larc generate`)
- Development server with hot reload (`larc dev`)
- Production builds (`larc build`)
- Component registry integration (`larc add`)

**create-larc-app**
https://github.com/larcjs/create-larc-app
```bash
$ npx create-larc-app my-app
```
Zero-configuration starter for new LARC projects. Includes pre-configured development environment, example components, and build tooling.

## Learning Resources

### Video Tutorials

**LARC Fundamentals (YouTube)**
https://youtube.com/playlist?list=PLarc-fundamentals
Official video series covering:

- Introduction to LARC (15 min)
- PAN Bus Messaging (22 min)
- Component Development (28 min)
- State Management Patterns (35 min)
- Building a Complete Application (1h 15min)

**Egghead.io: Building with LARC**
https://egghead.io/courses/building-with-larc
Professional screencast series (paid) with bite-sized lessons on specific topics. High production quality with accompanying code repositories.

**Frontend Masters: LARC Workshop**
https://frontendmasters.com/courses/larc
Full-day workshop covering LARC from fundamentals to advanced patterns. Includes exercises, quizzes, and downloadable resources.

### Blog Posts and Articles

**LARC Blog**
https://blog.larcjs.org
Official blog with deep dives into architecture decisions, release notes, performance analysis, and best practices from core maintainers.

**CSS-Tricks: LARC Guide Series**
https://css-tricks.com/guides/larc
Multi-part guide covering LARC from a frontend developer's perspective. Excellent for understanding how LARC fits into modern web development.

**Smashing Magazine: Component Architecture with LARC**
https://smashingmagazine.com/larc-component-architecture
In-depth article comparing LARC's approach to other component frameworks. Good for understanding trade-offs and architectural decisions.

### Podcasts

**Syntax.fm: LARC Deep Dive**
https://syntax.fm/show/larc-deep-dive
Popular web development podcast featuring LARC's creator discussing philosophy, implementation, and future direction.

**ShopTalk Show: Building without Build Tools**
https://shoptalkshow.com/larc-episode
Discussion of zero-build development philosophy and LARC's approach to modern web development.

## Related Projects and Technologies

### Web Components Standards

**Web Components at MDN**
https://developer.mozilla.org/en-US/docs/Web/Web_Components
Comprehensive documentation for Custom Elements, Shadow DOM, HTML Templates, and related browser APIs that LARC builds upon.

**webcomponents.org**
https://webcomponents.org
Community hub for Web Components with tutorials, best practices, and a component directory. Not LARC-specific but highly relevant.

**Custom Elements Everywhere**
https://custom-elements-everywhere.com
Test suite showing how different frameworks work with Web Components. Demonstrates LARC's excellent interoperability.

### Message Bus Patterns

**Enterprise Integration Patterns: Messaging**
https://enterpriseintegrationpatterns.com/patterns/messaging
Classic reference for message-based architecture patterns. LARC implements many patterns described here adapted for browser environments.

**Reactive Manifesto**
https://reactivemanifesto.org
Principles of reactive system design that influenced LARC's architecture, particularly around message-driven communication.

### Complementary Technologies

**IndexedDB API**
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
Browser database API used by LARC storage components for client-side persistence.

**Origin Private File System (OPFS)**
https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
Modern file system API supported by LARC file management components.

**BroadcastChannel API**
https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
Cross-tab communication API used by LARC for multi-window synchronization.

## Backend Integration

### LARC-Compatible Backends

**Node.js Backend Examples**
https://github.com/larcjs/examples/tree/main/backends/nodejs
Reference implementations showing REST and WebSocket backends for LARC applications. Includes authentication, file uploads, and real-time features.

**Python/Flask Backend Examples**
https://github.com/larcjs/examples/tree/main/backends/python
Python backend examples demonstrating API design patterns that work well with LARC frontend applications.

**Deno Backend Examples**
https://github.com/larcjs/examples/tree/main/backends/deno
Modern JavaScript runtime examples showing how to build backends without Node.js dependencies.

### API Design Guides

**REST API Design for LARC Applications**
https://larcjs.org/guides/rest-api-design
Best practices for designing REST APIs that integrate cleanly with LARC's data components and message patterns.

**WebSocket Integration Guide**
https://larcjs.org/guides/websocket-integration
How to implement real-time features using WebSocket connections with LARC's messaging system.

## Testing and Quality

### Testing Resources

**LARC Testing Guide**
https://larcjs.org/guides/testing
Official guide for testing LARC applications covering unit tests, integration tests, end-to-end tests, and visual regression testing.

**Web Test Runner**
https://modern-web.dev/docs/test-runner/overview
Recommended test runner for LARC applications. Fast, supports Web Components natively, and requires no browser driver.

**Playwright**
https://playwright.dev
End-to-end testing framework recommended for LARC application testing. Excellent Web Component support and debugging tools.

### Performance Resources

**Web Performance Working Group**
https://w3c.github.io/web-performance
W3C standards for measuring and optimizing web performance. LARC follows these standards for component performance metrics.

**web.dev Performance**
https://web.dev/performance
Google's comprehensive performance guide covering Core Web Vitals, optimization techniques, and measurement tools relevant to LARC applications.

## Contributing and Extending

### Contribution Guides

**Contributing to LARC Core**
https://github.com/larcjs/larc/blob/main/CONTRIBUTING.md
Guidelines for contributing to the LARC core framework. Includes coding standards, testing requirements, and pull request process.

**Publishing Components**
https://larcjs.org/guides/publishing-components
How to create, document, and publish reusable LARC components for the community. Covers naming conventions, versioning, and registry submission.

**Component Development Guide**
https://larcjs.org/guides/component-development
Best practices for building high-quality LARC components including accessibility, performance, and API design.

### Governance and Roadmap

**LARC Roadmap**
https://github.com/larcjs/larc/blob/main/ROADMAP.md
Public roadmap showing planned features, architectural improvements, and long-term vision. Community feedback welcome.

**RFC Process**
https://github.com/larcjs/rfcs
Request for Comments process for proposing major changes to LARC. Review active RFCs and submit your own proposals.

**Governance Model**
https://github.com/larcjs/larc/blob/main/GOVERNANCE.md
How LARC is governed, who makes decisions, and how the community can participate in the project's direction.

## Package Registries

### NPM Packages

**@larcjs/core**
https://npmjs.com/package/@larcjs/core
Core framework package containing PAN bus, autoloader, and foundational components.

**@larcjs/components**
https://npmjs.com/package/@larcjs/components
Official component library with UI, data, and integration components.

**@larcjs/core-types**
https://npmjs.com/package/@larcjs/core-types
TypeScript type definitions for LARC core APIs and components.

**@larcjs/testing-library**
https://npmjs.com/package/@larcjs/testing-library
Testing utilities and helpers for LARC applications.

### CDN Distributions

**unpkg.com**
https://unpkg.com/@larcjs/core@latest
Fast, global CDN for quick prototyping and development. Automatically serves latest versions.

**jsDelivr**
https://cdn.jsdelivr.net/npm/@larcjs/core@latest
Alternative CDN with excellent performance and reliability. Supports version pinning and package exploration.

**LARC Official CDN**
https://cdn.larcjs.org
Official CDN optimized for LARC with guaranteed uptime, geographic distribution, and versioned URLs.

## Books and Long-Form Resources

### Recommended Reading

**Web Components: From Zero to Hero**
By Pascal Schilp
Foundation knowledge for understanding the Web Components standards that LARC builds upon. Available free online.

**Component-Based Development in JavaScript**
By Oliver Steele
Explores component architecture patterns with examples in multiple frameworks including LARC. Good for understanding architectural trade-offs.

**Event-Driven Architecture**
By Martin Fowler
Classic software architecture text covering message-based patterns that inform LARC's design philosophy.

### Academic Papers

**Web Components: Standards, Patterns, and Best Practices**
Research paper analyzing Web Components adoption and patterns. Includes LARC case studies.

**Message-Oriented Middleware for Browser Applications**
Academic treatment of message bus patterns in web applications with LARC as example implementation.

## Deployment and Hosting

### Hosting Platforms

**Netlify**
https://netlify.com
Recommended static hosting platform for LARC applications. Free tier suitable for most projects. Excellent CDN and deployment pipeline.

**Vercel**
https://vercel.com
Alternative hosting platform with Git integration, preview deployments, and serverless functions for backend features.

**Cloudflare Pages**
https://pages.cloudflare.com
Global edge network hosting with fast deployments and excellent performance. Good for international applications.

**GitHub Pages**
https://pages.github.com
Free hosting for open source projects. Simple deployment directly from GitHub repositories.

### Deployment Guides

**LARC Deployment Guide**
https://larcjs.org/guides/deployment
Comprehensive guide covering deployment options, optimization strategies, caching configuration, and production best practices.

**Performance Optimization Guide**
https://larcjs.org/guides/performance-optimization
How to optimize LARC applications for production including code splitting, lazy loading, asset optimization, and CDN configuration.

## Events and Training

### Conferences

**LARC Conf**
https://conf.larcjs.org
Annual conference dedicated to LARC featuring talks, workshops, and networking. Recordings available online.

**Web Components Summit**
https://webcomponentssummit.com
General Web Components conference with LARC-specific tracks and presentations.

### Workshops and Training

**Official LARC Workshops**
https://larcjs.org/workshops
In-person and virtual workshops taught by LARC experts. Topics range from fundamentals to advanced patterns.

**Corporate Training**
https://larcjs.org/training
Customized training programs for enterprise teams. Includes on-site workshops, consultation, and ongoing support.

## Community Projects

### Notable Applications Built with LARC

Browse https://larcjs.org/showcase for featured applications demonstrating LARC's capabilities in production environments.

### Open Source Projects

**LARC DevTools**
Browser extension and debugging toolkit (open source)

**LARC Component Library Templates**
Starter templates for building your own component libraries

**LARC Form Builder**
Visual form builder with code generation

**LARC Dashboard Framework**
Composable dashboard system with widgets and layouts

## Stay Updated

### Newsletters

**LARC Weekly**
https://larcjs.org/newsletter
Weekly newsletter covering LARC news, tutorials, community projects, and ecosystem updates.

**Web Components Weekly**
https://webcomponents.dev/newsletter
General Web Components newsletter that frequently features LARC content.

### Release Notes

**LARC Changelog**
https://github.com/larcjs/larc/blob/main/CHANGELOG.md
Detailed changelog for all LARC releases including breaking changes, new features, and bug fixes.

**Security Advisories**
https://github.com/larcjs/larc/security/advisories
Security announcements and vulnerability reports. Subscribe for critical updates.

## Getting Help

When you need assistance:

1. **Search existing resources**: Check documentation, Stack Overflow, and GitHub Discussions first
2. **Prepare a minimal reproduction**: Create a CodeSandbox or GitHub repo demonstrating your issue
3. **Be specific**: Include LARC version, browser, error messages, and what you've already tried
4. **Choose the right channel**:

   - Technical questions → Stack Overflow (tag: `larc`)
   - Bug reports → GitHub Issues
   - General discussion → GitHub Discussions or Discord
   - Real-time help → Discord #help channel

### Support Options

**Community Support (Free)**
Discord, GitHub Discussions, Stack Overflow

**Professional Support**
https://larcjs.org/support
Commercial support plans available for enterprise users needing guaranteed response times and consulting.

---

This appendix is maintained by the LARC community. To suggest additions or corrections, submit a pull request to https://github.com/larcjs/larc-docs or open an issue describing the change.

*Last updated: December 2025*
