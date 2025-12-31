# Building with LARC: A Reference Manual

**A comprehensive reference guide for building modern web applications with LARC (Lightweight Async Reactive Components)**

---

## About This Book

"Building with LARC: A Reference Manual" is the definitive technical reference for LARC developers. Unlike the narrative tutorial "Learning LARC," this book is organized for quick reference, comprehensive API documentation, and practical problem-solving.

This book follows the O'Reilly programming book tradition—starting with philosophy and context, moving through practical implementation, and concluding with exhaustive API documentation and quick-reference appendices.

**Target Audience**: Experienced web developers who want a comprehensive reference for building production applications with LARC.

**Companion Book**: [Learning LARC](../learning-larc/) - A narrative, tutorial-style introduction to LARC concepts.

## 📦 Building the Book

This book can be built in multiple formats:

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 3 easy steps
- **[BUILD.md](BUILD.md)** - Complete build documentation
- **Build Script**: `./build-book.sh` - Generates HTML, PDF, and EPUB

```bash
# Quick build (all formats)
./build-book.sh

# Or use Make/npm
make
npm run build
```

**Output Formats**:

- 📄 **HTML** - `output/html/building-with-larc.html`
- 📕 **PDF** - `output/pdf/building-with-larc.pdf`
- 📱 **EPUB** - `output/epub/building-with-larc.epub`

---

## Table of Contents

### Part I: Foundations

**[Chapter 1: Introduction](chapters/01-introduction.md)**

- What is LARC?
- Who should use this book
- How to use this book
- Relationship to "Learning LARC"
- Prerequisites and assumptions
- Book conventions and notation

**[Chapter 2: Core Concepts](chapters/02-core-concepts.md)**

- Message bus architecture
- Pub/sub pattern in depth
- Topics and routing
- Message lifecycle
- Components and composition
- State management strategies

**[Chapter 3: Getting Started](chapters/03-getting-started.md)**

- Installation and setup
- Project structure recommendations
- Development environment
- Serving static files
- Browser requirements and compatibility
- DevTools and debugging setup

---

### Part II: Building Applications

**[Chapter 4: State Management](chapters/04-state-management.md)**

- Local vs. shared state
- State persistence strategies (localStorage, IndexedDB, OPFS)
- State synchronization patterns
- Optimistic updates
- Conflict resolution

**[Chapter 5: Routing and Navigation](chapters/05-routing-and-navigation.md)**

- Client-side routing with pan-routes
- Route definitions and patterns
- Navigation guards
- Deep linking
- History management
- SEO considerations

**[Chapter 6: Forms and User Input](chapters/06-forms-and-user-input.md)**

- Form handling patterns
- Schema-driven forms
- Validation strategies
- File uploads
- Rich text editing
- Markdown integration

**[Chapter 7: Data Fetching and APIs](chapters/07-data-fetching-and-apis.md)**

- REST API integration
- GraphQL connectors
- WebSocket communication
- Server-Sent Events (SSE)
- Error handling and retries
- Caching strategies

**[Chapter 8: Authentication and Authorization](chapters/08-authentication-and-authorization.md)**

- JWT authentication patterns
- Session management
- Role-based access control
- Security best practices
- Protected routes
- Token refresh strategies

**[Chapter 9: Real-time Features](chapters/09-realtime-features.md)**

- WebSocket integration
- SSE for live updates
- BroadcastChannel for multi-tab sync
- Web Workers for background tasks
- Real-time collaboration patterns

**[Chapter 10: File Management](chapters/10-file-management.md)**

- OPFS file operations
- File browser components
- Upload and download
- File type filtering
- Directory navigation
- Storage quotas and limits

**[Chapter 11: Theming and Styling](chapters/11-theming-and-styling.md)**

- CSS custom properties
- Theme system architecture
- Light/dark mode
- Theme provider component
- Dynamic theme switching
- Responsive design patterns

**[Chapter 12: Performance Optimization](chapters/12-performance-optimization.md)**

- Message filtering and routing efficiency
- Component lazy loading
- Virtual scrolling for large lists
- Debouncing and throttling
- Memory management
- Bundle size optimization

**[Chapter 13: Testing Strategies](chapters/13-testing-strategies.md)**

- Unit testing components
- Integration testing message flows
- E2E testing with PAN apps
- Mocking the bus
- Testing async operations
- Test utilities and helpers

**[Chapter 14: Error Handling and Debugging](chapters/14-error-handling-and-debugging.md)**

- Error boundaries
- Message tracing
- DevTools integration
- Logging strategies
- Error reporting
- Common pitfalls and solutions

**[Chapter 15: Advanced Patterns](chapters/15-advanced-patterns.md)**

- Message forwarding and bridging
- Multi-bus architectures
- Backend integration strategies
- Micro-frontends with LARC
- Plugin systems
- Middleware patterns

**[Chapter 16: Deployment and Production](chapters/16-deployment-and-production.md)**

- Build considerations (or lack thereof)
- CDN deployment
- Caching strategies
- Performance monitoring
- Production debugging
- Versioning and upgrades

---

### Part III: Component Reference

**[Chapter 17: Core Components](chapters/17-core-components.md)**

- **pan-bus**: Message bus with pub/sub architecture
- **pan-theme-provider**: Theme management system
- **pan-theme-toggle**: Theme switching UI control
- **pan-routes**: Message routing and transformation

**[Chapter 18: Data Components](chapters/18-data-components.md)**

- **pan-store**: Reactive state management
- **pan-idb**: IndexedDB integration

**[Chapter 19: UI Components](chapters/19-ui-components.md)**

- **pan-files**: File browser with OPFS
- **pan-markdown-editor**: Rich markdown editor
- **pan-markdown-renderer**: Markdown display

**[Chapter 20: Integration Components](chapters/20-integration-components.md)**

- **pan-data-connector**: REST API integration
- **pan-graphql-connector**: GraphQL client
- **pan-websocket**: WebSocket communication
- **pan-sse**: Server-Sent Events

**[Chapter 21: Utility Components](chapters/21-utility-components.md)**

- **pan-debug**: Message tracing and debugging
- **pan-forwarder**: HTTP message forwarding

---

### Part IV: Appendices

**[Appendix A: Message Topics Reference](appendix-a-message-topics.md)** (2,945 words)

- Standard topic conventions
- Reserved topics
- Topic naming best practices
- Topic hierarchy patterns

**[Appendix B: Event Envelope Specification](appendix-b-event-envelope.md)** (3,186 words)

- Envelope structure
- Standard fields
- Metadata
- Versioning

**[Appendix C: Configuration Options](appendix-c-configuration-options.md)** (3,204 words)

- Bus configuration
- Component configuration
- Global settings
- Environment variables

**[Appendix D: Migration Guide](appendix-d-migration-guide.md)** (2,800 words)

- Upgrading from older versions
- Breaking changes
- Deprecation notices
- Migration patterns

**[Appendix E: Recipes and Patterns](appendix-e-recipes-and-patterns.md)** (3,800 words)

- Common use cases
- Code snippets
- Design patterns
- Anti-patterns to avoid

**[Appendix F: Glossary](appendix-f-glossary.md)** (2,600 words)

- Technical terms
- LARC-specific terminology
- Web standards references

**[Appendix G: Resources](appendix-g-resources.md)** (1,850 words)

- Official documentation
- Community links
- Example applications
- Related projects
- Further reading

**[Index](index.md)**

- Comprehensive alphabetical index of all topics, APIs, components, and concepts

---

## Book Statistics

- **Total Chapters**: 21 chapters + 7 appendices + index
- **Total Word Count**: ~82,000 words
- **Code Examples**: 200+ complete, working examples
- **Components Documented**: 13 core LARC components
- **Recipes**: 10+ practical, copy-paste ready patterns

---

## Browser Compatibility

LARC requires modern browsers with support for:
- **Custom Elements v1** (Chrome 54+, Firefox 63+, Safari 10.1+, Edge 79+)
- **Shadow DOM v1** (Chrome 53+, Firefox 63+, Safari 10+, Edge 79+)
- **ES Modules** (Chrome 61+, Firefox 60+, Safari 11+, Edge 79+)
- **Import Maps** (Chrome 89+, Firefox 108+, Safari 16.4+, Edge 89+)

**Minimum versions**:
- Chrome/Edge: 89+ (March 2021)
- Firefox: 108+ (December 2022)
- Safari: 16.4+ (March 2023)

All code examples in this reference manual work without polyfills or transpilation in these browsers. For production applications targeting older browsers, consider using appropriate polyfills.

---

## How to Use This Book

### As a Learning Resource
Read Part I (Chapters 1-3) to understand LARC's philosophy and core concepts. Then work through Part II (Chapters 4-16) following the practical examples.

### As a Reference
Keep Part III (Chapters 17-21) bookmarked for quick API lookups. Use the Index to quickly find specific topics, patterns, or components.

### As a Problem-Solving Guide
When you encounter a specific challenge, consult:

- **Chapter 18** for debugging issues
- **Appendix E** for common patterns and recipes
- **Part II** chapters for implementation guidance
- **Part III** for component-specific solutions

### For Migration and Maintenance
Use Appendix D when upgrading LARC versions, and refer to Chapter 20 for production deployment strategies.

---

## Companion Materials

- **Learning LARC** - Narrative tutorial for beginners
- **LARC Examples** - Working demo applications at `/examples`
- **LARC Demo Apps** - Production-quality sample apps at `/apps`
- **Component Source Code** - Reference implementation at `/core`
- **API Documentation** - Generated docs at `/docs/api`

---

## Document Conventions

Throughout this book:

- **Code blocks** show complete, runnable examples
- **Component names** appear in monospace: `pan-bus`
- **Message topics** use dot notation: `user.login.success`
- **Attributes** are shown with values: `debug="true"`
- **Methods** include parentheses: `subscribe()`
- **File paths** are absolute from project root: `/src/app.js`

---

## About the Authors

This reference manual was created to complement the LARC framework and provide developers with comprehensive, accurate documentation for building production applications.

For questions, contributions, or feedback, see Appendix G: Resources.

---

## License

This documentation is provided as part of the LARC project and follows the same license as the framework.

---

**Last Updated**: December 2025
**LARC Version**: 3.x
**Book Version**: 1.0.0
