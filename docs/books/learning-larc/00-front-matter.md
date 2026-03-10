\pagebreak

---

## Praise for Learning LARC {.unnumbered}

*"LARC represents a return to web fundamentals while embracing modern capabilities. This book beautifully explains why that matters."*
— **David B. - Software Engineer**

*"Finally, a framework that respects the browser. Learning LARC shows you how to build without fighting the platform."*
— **Jon W. - App Developer**

*"The PAN bus architecture is elegant and powerful. This book makes it accessible to everyone."*
— **Mary S. - Designer / Artist**

\pagebreak

---

## Copyright {.unnumbered}

Copyright © 2025 LARC Team. All rights reserved.

Printed in the United States of America.

Published by LARC Press.

The LARC logo and name are trademarks of the LARC Project.

While the publisher and authors have used good faith efforts to ensure that the information and instructions contained in this work are accurate, the publisher and authors disclaim all responsibility for errors or omissions, including without limitation responsibility for damages resulting from the use of or reliance on this work.

Use of the information and instructions contained in this work is at your own risk. If any code samples or other technology this work contains or describes is subject to open source licenses or the intellectual property rights of others, it is your responsibility to ensure that your use thereof complies with such licenses and/or rights.

\pagebreak

---

## Table of Contents {.unnumbered}

### Preface {.unnumbered}

- Who This Book Is For
- What You'll Learn
- Conventions Used in This Book
- Using Code Examples
- How to Contact Us
- Acknowledgments

### Part I: Foundations {.unnumbered}

**Chapter 1: Philosophy and Background**

- The Problem with Modern Web Development
- A Return to Fundamentals
- The LARC Philosophy
- Why "No Build" Matters
- When to Use LARC
- What You'll Build

**Chapter 2: Core Concepts**

- Web Components Refresher
- The Page Area Network (PAN)
- Event-Driven Architecture
- State Management Philosophy
- Module System
- The Component Lifecycle

**Chapter 3: Getting Started**

- Setting Up Your Development Environment
- Your First LARC Application
- Project Structure
- Import Maps Explained
- Development Workflow
- Common Patterns

### Part II: Building Components {.unnumbered}

**Chapter 4: Creating Web Components**

- Anatomy of a LARC Component
- Shadow DOM Deep Dive
- Attributes and Properties
- Component Styling
- Lifecycle Methods
- Testing Components

**Chapter 5: The PAN Bus**

- Understanding Pub/Sub Architecture
- Topics and Namespaces
- Publishing Messages
- Subscribing to Events
- Message Patterns
- Debugging PAN Communication

**Chapter 6: State Management**

- Component-Local State
- Shared State Patterns
- The pan-store Component
- IndexedDB Integration
- Persistence Strategies
- Offline-First Applications

**Chapter 7: Advanced Component Patterns**

- Compound Components
- Higher-Order Components
- Component Composition
- Slots and Content Projection
- Dynamic Component Loading
- Performance Optimization

### Part III: Building Applications {.unnumbered}

**Chapter 8: Business Logic Patterns**

- Business Logic in Components
- Domain Services and Orchestration
- Command and Query Patterns
- Error Recovery and Retries
- Decoupled Workflows with PAN Topics
- Best Practices for Maintainable Logic

**Chapter 9: Routing and Navigation**

- Client-Side Routing
- The pan-router Component
- Route Parameters
- Nested Routes
- Route Guards
- History Management

**Chapter 10: Forms and Validation**

- Form Components
- Two-Way Data Binding
- Validation Strategies
- Error Handling
- File Uploads
- Form Submission

### Part IV: Advanced Topics {.unnumbered}

**Chapter 11: Data Fetching and APIs**

- The pan-fetch Component
- REST API Integration
- GraphQL Support
- WebSocket Communication
- Server-Sent Events
- Error Handling and Retry Logic

**Chapter 12: Authentication and Security**

- Authentication Patterns
- The pan-auth Component
- JWT Token Management
- Protected Routes
- CORS Considerations
- Security Best Practices

**Chapter 13: Server Integration**

- Backend Architecture
- Node.js Integration
- PHP Connector
- Python/Django Integration
- Database Patterns
- Real-Time Communication

**Chapter 14: Testing**

- Unit Testing Components
- Integration Testing
- End-to-End Testing
- Visual Regression Testing
- Performance Testing
- Continuous Integration

**Chapter 15: Performance and Optimization**

- Loading Strategies
- Code Splitting
- Lazy Loading Components
- Caching Strategies
- Bundle Size Optimization
- Performance Monitoring

**Chapter 16: Deployment**

- Static Hosting
- CDN Configuration
- Environment Variables
- CI/CD Pipelines
- Monitoring and Analytics
- Production Best Practices

### Part V: Ecosystem {.unnumbered}

**Chapter 17: Component Library**

- Using the Component Registry
- Contributing Components
- Creating a Component Library
- Documentation Strategies
- Versioning and Releases

**Chapter 18: Tooling**

- Development Tools
- CLI Tools
- VS Code Integration
- Browser DevTools
- Debugging Techniques

**Chapter 19: Real-World Applications**

- Case Study: E-Commerce Platform
- Case Study: Dashboard Application
- Case Study: Blog/CMS
- Lessons Learned
- Best Practices

### Appendices {.unnumbered}

**Appendix A: Web Components API Reference**

- Custom Elements
- Shadow DOM
- HTML Templates
- ES Modules

**Appendix B: PAN Bus API Reference**

- Core Methods
- Message Formats
- Topic Patterns
- Configuration Options

**Appendix C: Component API Reference**

- Built-in Components
- Component Properties
- Events and Methods

**Appendix D: Migration Guides**

- From React
- From Vue
- From Angular

**Appendix E: Resources**

- Official Documentation
- Community Resources
- Video Tutorials
- Example Projects

\pagebreak

---

## Cross-Book Chapter Map {.unnumbered}

Use this table to jump between tutorial material in *Learning LARC* and reference material in *Building with LARC*.

| Learning LARC | Building with LARC |
|---|---|
| Ch 8: Business Logic Patterns | Ch 15: Advanced Patterns |
| Ch 9: Routing and Navigation | Ch 5: Routing and Navigation |
| Ch 10: Forms and Validation | Ch 6: Forms and User Input |
| Ch 11: Data Fetching and APIs | Ch 7: Data Fetching and APIs |
| Ch 12: Authentication and Security | Ch 8: Authentication and Authorization |
| Ch 13: Server Integration | Ch 20: Integration Components |
| Ch 14: Testing | Ch 13: Testing Strategies |
| Ch 15: Performance and Optimization | Ch 12: Performance Optimization |
| Ch 16: Deployment | Ch 16: Deployment and Production |
| Ch 17: Component Library | Ch 17-21: Component Reference |

\pagebreak

---

## Browser Compatibility Matrix {.unnumbered}

The examples in this book assume the browser supports Web Components and Import Maps natively.

| Browser | Minimum Version | Required For |
|---|---|---|
| Chrome | 89+ | Import Maps + full LARC examples |
| Edge | 89+ | Import Maps + full LARC examples |
| Firefox | 108+ | Import Maps + full LARC examples |
| Safari | 16.4+ | Import Maps + full LARC examples |

### Index {.unnumbered}

\pagebreak

---

## About the Author {.unnumbered}

Christopher Robison is a veteran software engineer and architect with nearly three decades of experience building systems that range from biotech and online trading platforms to complex web applications and AI-driven tools. A lifelong maker with a deep appreciation for open standards, he has spent his career exploring the boundaries of what the web can do when you stop fighting the platform and start embracing it.

He is the creator of LARC.js and the PAN message bus, a browser-native architecture inspired by the elegant simplicity of the automotive CAN bus. His work blends engineering pragmatism with a playful curiosity that has led him to design everything from 3D printers and robotics to interactive music systems and decentralized applications.

Christopher currently lives in San Francisco, where he continues to build things that bridge the digital and physical worlds — and occasionally sneaks off to play punk rock shows with his band.

**Website:** [https://larcjs.com](https://larcjs.com)

---
