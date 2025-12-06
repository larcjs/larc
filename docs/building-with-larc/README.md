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

**[Chapter 1: Introduction](chapter-01-introduction.md)** (2,335 words)
- What is LARC?
- Who should use this book
- How to use this book
- Relationship to "Learning LARC"
- Prerequisites and assumptions
- Book conventions and notation

**[Chapter 2: The Philosophy of LARC](chapter-02-philosophy.md)** (5,122 words)
- The state management crisis
- Message-passing architecture
- DOM-native communication principles
- Zero-dependency, zero-build philosophy
- Progressive enhancement and graceful degradation
- Comparison to other approaches (Redux, Vuex, MobX, Context API)

**[Chapter 3: The LARC Story](chapter-03-story.md)** (3,400 words)
- Origins and motivation
- Design decisions and trade-offs
- Evolution of the PAN (Page Area Network) concept
- Real-world use cases and applications
- Community and ecosystem

**[Chapter 4: Core Concepts](chapter-04-core-concepts.md)** (5,000+ words)
- Message bus architecture
- Pub/sub pattern in depth
- Topics and routing
- Message lifecycle
- Components and composition
- State management strategies
- Event envelopes and metadata

**[Chapter 5: Getting Started](chapter-05-getting-started.md)** (4,100 words)
- Installation and setup
- Project structure recommendations
- Development environment
- Serving static files
- Browser requirements and compatibility
- DevTools and debugging setup

---

### Part II: Building Applications

**[Chapter 6: Basic Message Flow](chapter-06-basic-message-flow.md)** (3,936 words)
- Publishing messages
- Subscribing to topics
- Wildcard patterns
- Message retention
- Unsubscribing and cleanup

**[Chapter 7: Working with Components](chapter-07-working-with-components.md)** (4,203 words)
- Creating web components
- Component lifecycle
- Shadow DOM considerations
- Connecting components via PAN bus
- Component communication patterns
- Reusable component design

**[Chapter 8: State Management](chapter-08-state-management.md)** (4,448 words)
- Local vs. shared state
- State persistence strategies
- IndexedDB integration
- OPFS (Origin Private File System)
- Synchronization patterns
- Conflict resolution

**[Chapter 9: Routing and Navigation](chapter-09-routing-and-navigation.md)** (4,000 words)
- Client-side routing with pan-routes
- Route definitions and patterns
- Navigation guards
- Deep linking
- History management
- SEO considerations

**[Chapter 10: Forms and User Input](chapter-10-forms-and-user-input.md)** (4,200 words)
- Form handling patterns
- Schema-driven forms
- Validation strategies
- File uploads
- Rich text editing
- Markdown integration

**[Chapter 11: Data Fetching and APIs](chapter-11-data-fetching-and-apis.md)** (4,100 words)
- REST API integration
- GraphQL connectors
- WebSocket communication
- Server-Sent Events (SSE)
- Error handling and retries
- Caching strategies

**[Chapter 12: Authentication and Authorization](chapter-12-authentication-and-authorization.md)** (3,900 words)
- JWT authentication patterns
- Session management
- Role-based access control
- Security best practices
- Protected routes
- Token refresh strategies

**[Chapter 13: Real-time Features](chapter-13-realtime-features.md)** (3,800 words)
- WebSocket integration
- SSE for live updates
- BroadcastChannel for multi-tab sync
- Web Workers for background tasks
- Real-time collaboration patterns

**[Chapter 14: File Management](chapter-14-file-management.md)** (3,700 words)
- OPFS file operations
- File browser components
- Upload and download
- File type filtering
- Directory navigation
- Storage quotas and limits

**[Chapter 15: Theming and Styling](chapter-15-theming-and-styling.md)** (3,800 words)
- CSS custom properties
- Theme system architecture
- Light/dark mode
- Theme provider component
- Dynamic theme switching
- Responsive design patterns

**[Chapter 16: Performance Optimization](chapter-16-performance-optimization.md)** (4,200 words)
- Message filtering and routing efficiency
- Component lazy loading
- Virtual scrolling for large lists
- Debouncing and throttling
- Memory management
- Bundle size optimization

**[Chapter 17: Testing Strategies](chapter-17-testing-strategies.md)** (4,500 words)
- Unit testing components
- Integration testing message flows
- E2E testing with PAN apps
- Mocking the bus
- Testing async operations
- Test utilities and helpers

**[Chapter 18: Error Handling and Debugging](chapter-18-error-handling-and-debugging.md)** (4,100 words)
- Error boundaries
- Message tracing
- DevTools integration
- Logging strategies
- Error reporting
- Common pitfalls and solutions

**[Chapter 19: Advanced Patterns](chapter-19-advanced-patterns.md)** (4,000 words)
- Message forwarding and bridging
- Multi-bus architectures
- Backend integration strategies
- Micro-frontends with LARC
- Plugin systems
- Middleware patterns

**[Chapter 20: Deployment and Production](chapter-20-deployment-and-production.md)** (4,200 words)
- Build considerations (or lack thereof)
- CDN deployment
- Caching strategies
- Performance monitoring
- Production debugging
- Versioning and upgrades

---

### Part III: Component Reference

**[Chapter 21: Core Components](chapter-21-core-components.md)** (5,849 words)
- **pan-bus**: Message bus with pub/sub architecture
- **pan-theme-provider**: Theme management system
- **pan-theme-toggle**: Theme switching UI control
- **pan-routes**: Message routing and transformation

**[Chapter 22: Data Components](chapter-22-data-components.md)** (5,100 words)
- **pan-store**: Reactive state management
- **pan-idb**: IndexedDB integration

**[Chapter 23: UI Components](chapter-23-ui-components.md)** (4,138 words)
- **pan-files**: File browser with OPFS
- **pan-markdown-editor**: Rich markdown editor
- **pan-markdown-renderer**: Markdown display

**[Chapter 24: Integration Components](chapter-24-integration-components.md)** (5,977 words)
- **pan-data-connector**: REST API integration
- **pan-graphql-connector**: GraphQL client
- **pan-websocket**: WebSocket communication
- **pan-sse**: Server-Sent Events

**[Chapter 25: Utility Components](chapter-25-utility-components.md)** (4,800 words)
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

- **Total Chapters**: 25 chapters + 7 appendices + index
- **Total Word Count**: ~115,000 words
- **Code Examples**: 200+ complete, working examples
- **Components Documented**: 13 core LARC components
- **Recipes**: 10 practical, copy-paste ready patterns

---

## How to Use This Book

### As a Learning Resource
Read Part I (Chapters 1-5) to understand LARC's philosophy and core concepts. Then work through Part II (Chapters 6-20) following the practical examples.

### As a Reference
Keep Part III (Chapters 21-25) bookmarked for quick API lookups. Use the Index to quickly find specific topics, patterns, or components.

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
- **Component Source Code** - Reference implementation at `/core/src/components`
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
