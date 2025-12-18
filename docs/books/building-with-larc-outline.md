# Building with LARC: A Reference Manual
## Chapter Outline

---

## Part I: Foundations

### Chapter 1: Introduction
- What is LARC?
- Who should use this book
- How to use this book (reference vs. tutorial)
- Relationship to "Learning LARC"
- Prerequisites and assumptions
- Book conventions and notation

### Chapter 2: The Philosophy of LARC
- The problem: Complex state management in modern web apps
- Why message-passing architecture?
- DOM-native communication principles
- Zero-dependency, zero-build philosophy
- Progressive enhancement and graceful degradation
- Comparison to other approaches (Redux, Vuex, MobX, etc.)

### Chapter 3: The LARC Story
- Origins and motivation
- Design decisions and trade-offs
- Evolution of the PAN (Page Area Network) concept
- Real-world use cases and applications
- Community and ecosystem

### Chapter 4: Core Concepts
- Message bus architecture
- Pub/sub pattern in depth
- Topics and routing
- Message lifecycle
- Components and composition
- State management strategies
- Event envelopes and metadata

### Chapter 5: Getting Started
- Installation and setup
- Project structure recommendations
- Development environment
- Serving static files
- Browser requirements and compatibility
- DevTools and debugging setup

---

## Part II: Building Applications

### Chapter 6: Basic Message Flow
- Publishing messages
- Subscribing to topics
- Wildcard patterns
- Message retention
- Unsubscribing and cleanup

### Chapter 7: Working with Components
- Creating web components
- Component lifecycle
- Shadow DOM considerations
- Connecting components via PAN bus
- Component communication patterns
- Reusable component design

### Chapter 8: State Management
- Local vs. shared state
- State persistence strategies
- IndexedDB integration
- OPFS (Origin Private File System)
- Synchronization patterns
- Conflict resolution

### Chapter 9: Routing and Navigation
- Client-side routing with pan-routes
- Route definitions and patterns
- Navigation guards
- Deep linking
- History management
- SEO considerations

### Chapter 10: Forms and User Input
- Form handling patterns
- Schema-driven forms
- Validation strategies
- File uploads
- Rich text editing
- Markdown integration

### Chapter 11: Data Fetching and APIs
- REST API integration
- GraphQL connectors
- WebSocket communication
- Server-Sent Events (SSE)
- Error handling and retries
- Caching strategies

### Chapter 12: Authentication and Authorization
- JWT authentication patterns
- Session management
- Role-based access control
- Security best practices
- Protected routes
- Token refresh strategies

### Chapter 13: Real-time Features
- WebSocket integration
- SSE for live updates
- BroadcastChannel for multi-tab sync
- Web Workers for background tasks
- Real-time collaboration patterns

### Chapter 14: File Management
- OPFS file operations
- File browser components
- Upload and download
- File type filtering
- Directory navigation
- Storage quotas and limits

### Chapter 15: Theming and Styling
- CSS custom properties
- Theme system architecture
- Light/dark mode
- Theme provider component
- Dynamic theme switching
- Responsive design patterns

### Chapter 16: Performance Optimization
- Message filtering and routing efficiency
- Component lazy loading
- Virtual scrolling for large lists
- Debouncing and throttling
- Memory management
- Bundle size optimization

### Chapter 17: Testing Strategies
- Unit testing components
- Integration testing message flows
- E2E testing with PAN apps
- Mocking the bus
- Testing async operations
- Test utilities and helpers

### Chapter 18: Error Handling and Debugging
- Error boundaries
- Message tracing
- DevTools integration
- Logging strategies
- Error reporting
- Common pitfalls and solutions

### Chapter 19: Advanced Patterns
- Message forwarding and bridging
- Multi-bus architectures
- Backend integration strategies
- Micro-frontends with LARC
- Plugin systems
- Middleware patterns

### Chapter 20: Deployment and Production
- Build considerations (or lack thereof)
- CDN deployment
- Caching strategies
- Performance monitoring
- Production debugging
- Versioning and upgrades

---

## Part III: Component Reference

### Chapter 21: Core Components
#### pan-bus
- Purpose and usage
- Attributes and configuration
- Methods and API
- Events emitted
- Examples

#### pan-theme-provider
- Purpose and usage
- Theme configuration
- Attributes
- CSS variables
- Examples

#### pan-theme-toggle
- Purpose and usage
- Variants (button, icon)
- Customization
- Examples

#### pan-routes
- Purpose and usage
- Route configuration
- Navigation methods
- Guards and middleware
- Examples

### Chapter 22: Data Components
#### pan-store
- Purpose and usage
- State management API
- Persistence options
- Subscribers
- Examples

#### pan-indexeddb
- Purpose and usage
- Database operations
- Schema management
- Queries
- Examples

### Chapter 23: UI Components
#### pan-files
- Purpose and usage
- File browser configuration
- File operations
- Events
- Examples

#### pan-markdown-editor
- Purpose and usage
- Editor configuration
- Toolbar customization
- Preview modes
- Examples

#### pan-markdown-renderer
- Purpose and usage
- Rendering options
- Sanitization
- Syntax highlighting
- Examples

### Chapter 24: Integration Components
#### pan-rest-connector
- Purpose and usage
- Endpoint configuration
- Request/response handling
- Error handling
- Examples

#### pan-graphql-connector
- Purpose and usage
- Query/mutation patterns
- Schema introspection
- Cache management
- Examples

#### pan-websocket
- Purpose and usage
- Connection management
- Message protocols
- Reconnection strategies
- Examples

#### pan-sse-connector
- Purpose and usage
- Event stream handling
- Reconnection
- Error recovery
- Examples

### Chapter 25: Utility Components
#### pan-debug
- Purpose and usage
- Tracing configuration
- Message inspection
- Performance monitoring
- Examples

#### pan-forwarder
- Purpose and usage
- Message routing rules
- Transformation
- Filtering
- Examples

---

## Part IV: Appendices

### Appendix A: Message Topics Reference
- Standard topic conventions
- Reserved topics
- Topic naming best practices
- Topic hierarchy patterns

### Appendix B: Event Envelope Specification
- Envelope structure
- Standard fields
- Metadata
- Versioning

### Appendix C: Configuration Options
- Bus configuration
- Component configuration
- Global settings
- Environment variables

### Appendix D: Migration Guide
- Upgrading from older versions
- Breaking changes
- Deprecation notices
- Migration patterns

### Appendix E: Recipes and Patterns
- Common use cases
- Code snippets
- Design patterns
- Anti-patterns to avoid

### Appendix F: Glossary
- Technical terms
- LARC-specific terminology
- Web standards references

### Appendix G: Resources
- Official documentation
- Community links
- Example applications
- Related projects
- Further reading

---

## Notes on Book Structure

- **Part I (Foundations)**: Context, philosophy, and core concepts - similar to Perl's storytelling approach
- **Part II (Building Applications)**: Task-oriented chapters showing how to accomplish specific goals
- **Part III (Component Reference)**: Comprehensive API documentation for each component
- **Part IV (Appendices)**: Quick reference materials and supporting information

Each chapter in Part II follows a consistent structure:
1. Problem statement
2. Concepts and approach
3. Step-by-step implementation
4. Complete working example
5. Common variations
6. Troubleshooting
7. Best practices

Each component in Part III follows a consistent structure:
1. Overview and purpose
2. When to use / when not to use
3. Installation and setup
4. Attributes reference
5. Methods reference
6. Events reference
7. Complete examples
8. Related components
9. Common issues and solutions
