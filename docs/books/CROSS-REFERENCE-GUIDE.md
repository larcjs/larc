# LARC Books Cross-Reference Guide

This guide maps topics between *Learning LARC* (tutorial) and *Building with LARC* (reference manual) to help readers find complementary information in both books.

---

## How to Use This Guide

- **Learning LARC → Building with LARC**: Find deeper API documentation and patterns
- **Building with LARC → Learning LARC**: Find tutorial examples and hands-on exercises

---

## Chapter Mapping by Topic

### Foundations

| Topic | Learning LARC | Building with LARC |
|-------|---------------|-------------------|
| **Philosophy & Background** | Ch 1: Philosophy and Background | Ch 1: Introduction |
| **Core Concepts** | Ch 2: Core Concepts | Ch 2: Core Concepts |
| **Getting Started** | Ch 3: Getting Started | Ch 3: Getting Started |

---

### Component Development

| Topic | Learning LARC | Building with LARC |
|-------|---------------|-------------------|
| **Creating Components** | Ch 4: Creating Web Components | - |
| **PAN Bus Fundamentals** | Ch 5: The PAN Bus | Ch 2: Core Concepts |
| **State Management** | Ch 6: State Management | Ch 4: State Management |
| **Advanced Patterns** | Ch 7: Advanced Component Patterns | Ch 15: Advanced Patterns |

---

### Application Building

| Topic | Learning LARC | Building with LARC |
|-------|---------------|-------------------|
| **Routing** | Ch 8: Routing and Navigation | Ch 5: Routing and Navigation |
| **Forms** | Ch 9: Forms and Validation | Ch 6: Forms and User Input |
| **Data Fetching** | Ch 11: Data Fetching and APIs | Ch 7: Data Fetching and APIs |
| **Authentication** | Ch 12: Authentication and Security | Ch 8: Authentication and Authorization |
| **Server Integration** | Ch 13: Server Integration | (covered across multiple chapters) |

---

### Advanced Topics

| Topic | Learning LARC | Building with LARC |
|-------|---------------|-------------------|
| **Testing** | Ch 14: Testing | Ch 13: Testing Strategies |
| **Performance** | Ch 15: Performance and Optimization | Ch 12: Performance Optimization |
| **Deployment** | Ch 16: Deployment | Ch 16: Deployment and Production |
| **Real-time Features** | Ch 11: Data Fetching (WebSockets/SSE) | Ch 9: Real-time Features |
| **File Management** | (covered in Ch 13: Server Integration) | Ch 10: File Management |
| **Theming** | Ch 4: Creating Web Components (styling) | Ch 11: Theming and Styling |

---

### Ecosystem

| Topic | Learning LARC | Building with LARC |
|-------|---------------|-------------------|
| **Component Libraries** | Ch 17: Component Library | Ch 17-21: Component Reference |
| **Tooling** | Ch 18: Tooling | Ch 14: Error Handling and Debugging |
| **Real-World Apps** | Ch 19: Real-World Applications | (examples throughout) |

---

## Component Documentation Cross-Reference

| Component | Learning LARC | Building with LARC |
|-----------|---------------|-------------------|
| **pan-bus** | Ch 5: The PAN Bus | Ch 17: Core Components |
| **pan-store** | Ch 6: State Management | Ch 18: Data Components |
| **pan-idb** | Ch 6: State Management | Ch 18: Data Components |
| **pan-routes** | Ch 8: Routing and Navigation | Ch 17: Core Components |
| **pan-theme-provider** | Ch 4: Creating Web Components | Ch 17: Core Components |
| **pan-theme-toggle** | Ch 4: Creating Web Components | Ch 17: Core Components |
| **pan-files** | Ch 13: Server Integration | Ch 19: UI Components |
| **pan-markdown-editor** | Ch 9: Forms and Validation | Ch 19: UI Components |
| **pan-markdown-renderer** | Ch 9: Forms and Validation | Ch 19: UI Components |
| **pan-data-connector** | Ch 11: Data Fetching and APIs | Ch 20: Integration Components |
| **pan-graphql-connector** | Ch 11: Data Fetching and APIs | Ch 20: Integration Components |
| **pan-websocket** | Ch 11: Data Fetching and APIs | Ch 20: Integration Components |
| **pan-sse** | Ch 11: Data Fetching and APIs | Ch 20: Integration Components |
| **pan-debug** | Ch 18: Tooling | Ch 21: Utility Components |
| **pan-forwarder** | Ch 13: Server Integration | Ch 21: Utility Components |

---

## Appendices Cross-Reference

| Topic | Learning LARC | Building with LARC |
|-------|---------------|-------------------|
| **Web Components API** | Appendix A | (integrated throughout) |
| **PAN Bus API** | Appendix B | Ch 2: Core Concepts |
| **Component Quick Reference** | Appendix C | Ch 17-21: Component Reference |
| **Migration Guides** | Appendix D | Appendix D: Migration Guide |
| **Message Topics** | Appendix B | Appendix A: Message Topics Reference |
| **Event Envelope** | (in Ch 5) | Appendix B: Event Envelope Specification |
| **Configuration Options** | (throughout chapters) | Appendix C: Configuration Options |
| **Recipes & Patterns** | (as exercises) | Appendix E: Recipes and Patterns |
| **Glossary** | (inline definitions) | Appendix F: Glossary |
| **Resources** | Appendix E | Appendix G: Resources |

---

## By Learning Path

### "I'm Just Starting with LARC"

**Start here:**
1. *Learning LARC* Ch 1-3 (Philosophy, Concepts, Getting Started)
2. *Building with LARC* Ch 1 (Introduction) - understand book relationship
3. *Learning LARC* Ch 4-7 (Components, PAN Bus, State, Patterns)

**Then explore:**
- *Learning LARC* Ch 8-10 (Routing, Forms, Data) with hands-on exercises
- Refer to *Building with LARC* for API details as needed

---

### "I Know the Basics, Need Production Patterns"

**Focus on:**
1. *Learning LARC* Ch 11-16 (Data, Auth, Server, Testing, Performance, Deployment)
2. *Building with LARC* Ch 4-16 (Implementation details for production)
3. *Building with LARC* Appendix E (Recipes and Patterns)

**Reference:**
- *Learning LARC* Ch 19 for complete real-world applications
- *Building with LARC* Ch 16 for deployment strategies

---

### "I Need API Documentation"

**Go straight to:**
1. *Building with LARC* Ch 17-21 (Component Reference)
2. *Building with LARC* Appendices A-C (Message Topics, Event Envelope, Configuration)
3. *Building with LARC* Index (when completed)

**Supplement with:**
- *Learning LARC* chapters for usage examples
- *Building with LARC* Appendix E for copy-paste recipes

---

### "I'm Migrating from React/Vue/Angular"

**Essential reading:**
1. *Learning LARC* Ch 1 (understand philosophy differences)
2. *Learning LARC* Appendix D (Migration Cheat Sheet)
3. *Building with LARC* Appendix D (Migration Guide)
4. *Learning LARC* Ch 19 (Real-World Applications - see complete examples)

**Then work through:**
- *Learning LARC* Ch 2-7 sequentially (rebuild mental models)
- Use *Building with LARC* as API reference

---

## Quick Topic Finder

### When You Need...

**Tutorial/Examples**: *Learning LARC*
- Progressive learning path
- Hands-on exercises (4 per chapter in Ch 11-19)
- Troubleshooting sections
- Complete case studies (Ch 19)

**API Reference**: *Building with LARC*
- Component documentation with attributes/methods/events
- Quick reference tables
- Copy-paste recipes
- Exhaustive API coverage

**Best Practices**: Both books
- *Learning LARC*: 10 best practices per chapter (Ch 11-19)
- *Building with LARC*: Appendix E (Recipes and Patterns)

**Real Code**: Both books
- *Learning LARC*: Complete applications (Ch 19: E-commerce, Dashboard, CMS)
- *Building with LARC*: Component recipes (Appendix E)

**Troubleshooting**: Both books
- *Learning LARC*: Problem/Symptom/Cause/Solution format (Ch 11-19)
- *Building with LARC*: Common pitfalls (Ch 14, 18)

---

## Special Cross-References

### State Management Deep Dive

1. Start: *Learning LARC* Ch 6 (conceptual overview with examples)
2. Deep dive: *Building with LARC* Ch 4 (patterns and strategies)
3. Components: *Building with LARC* Ch 18 (pan-store, pan-idb APIs)
4. Practice: *Learning LARC* Ch 6 exercises + Ch 19 case studies

### Authentication Implementation

1. Tutorial: *Learning LARC* Ch 12 (complete auth flow)
2. Reference: *Building with LARC* Ch 8 (JWT patterns, security)
3. Practice: *Learning LARC* Ch 12 exercises (OAuth integration)
4. Production: *Learning LARC* Ch 19 (real-world auth in e-commerce app)

### Performance Optimization

1. Learn: *Learning LARC* Ch 15 (lazy loading, code splitting, virtual scrolling)
2. Reference: *Building with LARC* Ch 12 (optimization patterns)
3. Measure: *Learning LARC* Ch 15 (Web Vitals monitoring)
4. Apply: *Learning LARC* Ch 19 (optimized dashboard case study)

### Testing Strategy

1. Foundations: *Learning LARC* Ch 14 (unit, integration, E2E)
2. Patterns: *Building with LARC* Ch 13 (test utilities, mocking)
3. Practice: *Learning LARC* Ch 14 exercises (TDD kata)
4. Real-world: *Learning LARC* Ch 19 (testing async components)

---

## Notes for Readers

### Reading Both Books

**Optimal approach:**
1. Read *Learning LARC* chapters sequentially (tutorial path)
2. Keep *Building with LARC* open for API lookups
3. Use this cross-reference to find related content
4. Do exercises in *Learning LARC* to reinforce concepts

### Reading Only One Book

**If you only have *Learning LARC*:**
- You can build complete LARC applications
- Exercises provide hands-on practice
- Ch 19 demonstrates production patterns
- Appendices cover essential APIs

**If you only have *Building with LARC*:**
- You have complete API reference
- Recipes provide working code
- May miss pedagogical progression
- Recommend getting *Learning LARC* for examples

---

## Version Information

- *Learning LARC*: 19 chapters + 5 appendices (~450-500 pages)
- *Building with LARC*: 21 chapters + 7 appendices (~320-350 pages)
- Both books cover LARC 3.x
- Last updated: December 2024

---

**For questions about which book to use:**
- **Learning?** Start with *Learning LARC*
- **Looking up APIs?** Use *Building with LARC*
- **Building production apps?** Use both together
- **Migrating frameworks?** Read migration guides in both

---

*This cross-reference guide is maintained as part of the LARC documentation project.*
