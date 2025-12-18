# Glossary

This glossary defines technical terms, LARC-specific concepts, and web standards references used throughout this manual. Terms are presented in alphabetical order with clear definitions and, where relevant, cross-references to related concepts.

## A

**Adapter**
A design pattern that converts one interface to another. In LARC contexts, adapters bridge LARC components with external libraries or non-standard APIs.

**Attribute**
An HTML element property set via markup (e.g., `<my-component data-id="123">`). LARC components observe attributes through `observedAttributes` and respond to changes via `attributeChangedCallback()`.

**Autonomous Custom Element**
A Web Component that extends `HTMLElement` directly rather than extending built-in HTML elements. LARC components are autonomous custom elements. Compare with *Customized Built-in Element*.

## B

**Batch Update**
An optimization technique that groups multiple state changes into a single render cycle, reducing unnecessary DOM operations and improving performance.

**Binding**
The connection between a data source and its visual representation. LARC uses event-driven updates rather than automatic data binding, giving developers explicit control over rendering.

**Browser Event**
Standard DOM events like `click`, `input`, or `submit`. LARC components listen to browser events and can translate them into PAN bus events for application-wide communication.

**Bubble**
Event propagation through the DOM tree from child to parent elements. Browser events bubble by default; custom events must explicitly enable bubbling via `bubbles: true`.

## C

**Callback**
A function passed as an argument to another function, executed after a specific event or operation completes. LARC lifecycle methods (`connectedCallback`, `disconnectedCallback`) are callbacks invoked by the browser at specific times.

**Composed**
An event property that determines whether the event crosses Shadow DOM boundaries. Set via `composed: true` in event initialization. Essential for events that need to traverse shadow roots.

**Component**
A self-contained, reusable user interface element. In LARC, components are Web Components registered via `customElements.define()` and implementing standard lifecycle callbacks.

**Custom Element**
The Web Components standard for creating new HTML elements with custom behavior. LARC applications are built from custom elements. See also *Autonomous Custom Element*.

**Customized Built-in Element**
A Web Component that extends an existing HTML element (e.g., `<button is="fancy-button">`). LARC primarily uses autonomous custom elements rather than customized built-ins.

## D

**Declarative**
A programming style that describes *what* should happen rather than *how*. HTML templates are declarative. Contrast with *Imperative*.

**Dependency Injection**
A pattern where dependencies are provided to a component rather than created internally. LARC components receive the PAN bus reference rather than accessing a global singleton.

**Dispatch**
Sending an event to the PAN bus for other components to receive. Called via `this.pan.dispatch(eventType, detail)`.

**DOM (Document Object Model)**
The browser's representation of an HTML document as a tree of objects. LARC components manipulate the DOM through standard APIs.

## E

**Element**
A node in the DOM tree representing an HTML tag. Custom elements are specialized elements with developer-defined behavior.

**Emit**
Synonym for *dispatch*. Some frameworks use "emit" for event publication. LARC prefers "dispatch" to align with standard DOM terminology.

**Encapsulation**
Hiding internal implementation details from external code. Shadow DOM provides style encapsulation; JavaScript class private fields provide data encapsulation.

**Event**
A signal indicating something happened. Browser events (clicks, inputs) and custom events (PAN bus messages) both use the Event API.

**Event Target**
Any object that can receive events and have listeners registered on it. All DOM nodes are event targets; the PAN bus is also an event target.

## F

**Fragment**
A `DocumentFragment` is a lightweight container for DOM nodes that can be manipulated off-screen and inserted into the document in one operation, reducing reflows.

**Framework**
A comprehensive library providing structure and conventions for application development. LARC is a lightweight component architecture rather than a full framework, emphasizing web standards.

## H

**HTML Template**
The `<template>` element stores client-side content that won't render until explicitly instantiated. Useful for defining reusable markup structures.

**Hydration**
The process of attaching event listeners and state to server-rendered HTML. LARC components hydrate automatically when defined via `customElements.define()`.

## I

**Imperative**
A programming style describing *how* to accomplish a task through explicit instructions. JavaScript is imperative. Contrast with *Declarative*.

**Intersection Observer**
A browser API for efficiently detecting when elements enter or leave the viewport. Used for lazy loading, infinite scroll, and visibility tracking.

## L

**LARC (Lightweight Asynchronous Reactive Components)**
The component architecture described in this manual, emphasizing web standards, minimal abstraction, and explicit communication patterns.

**Lifecycle**
The sequence of states a component passes through: creation, attachment to DOM, updates, and removal. LARC components implement standard Web Components lifecycle callbacks.

**Lifecycle Callback**
Methods invoked by the browser at specific points in a component's lifecycle: `constructor()`, `connectedCallback()`, `disconnectedCallback()`, `attributeChangedCallback()`, `adoptedCallback()`.

**Light DOM**
Regular DOM content, as opposed to Shadow DOM. Content placed inside a custom element's tags lives in the light DOM and can be redistributed via `<slot>`.

## M

**Microtask**
A JavaScript task scheduled via `Promise.then()` or `queueMicrotask()`. Microtasks run before the browser's next rendering cycle, useful for batching updates.

**Module**
An ES6 module (`import`/`export`) that encapsulates code. LARC components are typically defined as modules, one component per file.

**Mutation Observer**
A browser API for watching DOM changes. Less commonly needed in LARC since components manage their own rendering.

## N

**Namespace**
A prefix used to group related events or APIs. LARC encourages namespacing PAN bus events (e.g., `user:login`, `user:logout`) for better organization.

**Node**
A basic DOM building block. Elements, text, and comments are all nodes. Components manipulate nodes through standard DOM APIs.

## O

**Observer Pattern**
A design pattern where objects (observers) subscribe to state changes in another object (subject). The PAN bus implements the observer pattern.

**observedAttributes**
A static getter on custom element classes listing attributes the component wants to monitor. Changes trigger `attributeChangedCallback()`.

## P

**PAN Bus (Publish-and-subscribe Asynchronous Notification Bus)**
LARC's event system for component communication. Components dispatch events to the bus and subscribe to events they care about, enabling loose coupling.

**Polyfill**
JavaScript code that implements modern features in older browsers. Web Components polyfills enable LARC applications to run in browsers without native support.

**Prop (Property)**
Short for "property," data passed to a component. In LARC, complex data typically flows through PAN bus events rather than attributes, since attributes are limited to strings.

**Publish-Subscribe**
A messaging pattern where publishers send messages to topics/channels, and subscribers receive messages from those topics. The PAN bus is a pub-sub system.

## R

**Reactive**
A programming model where the UI automatically updates in response to data changes. LARC components implement reactivity explicitly through PAN bus subscriptions rather than automatic binding.

**Reconciliation**
The process of determining minimal DOM changes needed to reflect new state. LARC leaves reconciliation to developers or optional libraries rather than providing built-in virtual DOM diffing.

**Render**
Convert data into visual representation. In LARC, rendering is explicit—components call their own `render()` methods when appropriate.

**Reflow**
The browser's process of recalculating element positions and dimensions. Excessive reflows hurt performance. LARC's batch updates minimize reflows.

## S

**Scoped Styles**
CSS that applies only to a specific component without affecting other elements. Shadow DOM provides automatic style scoping.

**Shadow DOM**
A web standard for attaching encapsulated DOM trees to elements. Shadow DOM provides style and markup encapsulation, preventing styles from leaking in or out.

**Shadow Host**
The element to which a shadow root is attached. When you call `this.attachShadow()` on a custom element, that element becomes the shadow host.

**Shadow Root**
The root of a shadow DOM tree, created via `element.attachShadow()`. Content inside the shadow root is isolated from the main document.

**Slot**
A Shadow DOM feature for distributing light DOM content into shadow DOM. Defined with `<slot>` elements and allowing flexible content composition.

**State**
Data that determines component appearance and behavior. LARC encourages explicit state management through component properties and PAN bus events.

**Subscribe**
Registering a listener for events on the PAN bus. Called via `this.pan.subscribe(eventType, handler)`, returns an unsubscribe function.

## T

**Template**
Reusable markup structure. Can refer to HTML `<template>` elements or template literals (backtick strings) used for generating HTML.

**Template Literal**
JavaScript's backtick string syntax supporting multiline strings and interpolation. Commonly used for component templates: `` `<div>${value}</div>` ``.

**Throttle**
Limiting function execution frequency. Unlike debouncing (which delays until activity stops), throttling ensures a function runs at most once per time interval.

## U

**Unsubscribe**
Removing a listener from the PAN bus. The function returned by `subscribe()` acts as an unsubscribe callback, essential for preventing memory leaks.

**User Agent**
The browser or other software accessing a web application. User agent strings identify the browser type and version.

## V

**Virtual DOM**
An in-memory representation of the DOM used to calculate minimal changes before applying them. LARC doesn't include built-in virtual DOM, preferring explicit control or optional libraries.

## W

**Web Component**
An umbrella term for three standards: Custom Elements, Shadow DOM, and HTML Templates. LARC applications are built on Web Components.

**Web Standards**
Specifications maintained by standards bodies (W3C, WHATWG) defining how web technologies work. LARC prioritizes web standards over proprietary abstractions.

## LARC-Specific Terms

**Component Bus**
A dedicated PAN bus instance for a specific component subtree. Allows isolated event scopes within larger applications. Most applications use a single global bus.

**Component Tree**
The hierarchical structure of custom elements in an application. Events and data flow through this tree via the PAN bus.

**Event Detail**
The `detail` property of a custom event, containing application-specific data. PAN bus events place their payload in the detail object.

**Event Type**
A string identifying an event category (e.g., `'user:login'`, `'data:loaded'`). LARC encourages namespaced, descriptive event types.

**Pan Property**
The `pan` property on custom elements, providing access to the PAN bus. Automatically injected by LARC's component initialization.

**Reactive Primitive**
Basic reactive building blocks like reactive objects, computed values, and watchers. LARC's optional reactivity system provides these as lightweight utilities.

**Unidirectional Data Flow**
An architecture where data flows in one direction through an application. LARC encourages this through PAN bus events: components dispatch actions upward and listen for state changes downward.

## Web Standards References

**CustomElementRegistry**
The browser's registry of defined custom elements, accessed via `window.customElements`. Provides `define()`, `get()`, `whenDefined()`, and `upgrade()` methods.

**Event.prototype.composed**
Boolean property indicating whether an event crosses shadow DOM boundaries during event propagation.

**Event.prototype.bubbles**
Boolean property indicating whether an event propagates up the DOM tree from its target.

**HTMLElement**
The base interface for HTML elements. All LARC components extend `HTMLElement` or its subclasses.

**MutationObserver API**
Interface for observing DOM mutations. Occasionally useful for LARC components that need to react to external DOM changes.

**ShadowRoot**
Interface representing the root of a shadow DOM tree, providing methods like `querySelector()` that operate within the shadow scope.

**shadowRoot.mode**
The encapsulation mode of a shadow root: `'open'` (accessible via `element.shadowRoot`) or `'closed'` (inaccessible from outside). LARC recommends open mode for testability.

## Acronyms and Abbreviations

**API** - Application Programming Interface
**CDN** - Content Delivery Network
**CSS** - Cascading Style Sheets
**DOM** - Document Object Model
**ES6** - ECMAScript 2015 (JavaScript version)
**HTML** - HyperText Markup Language
**HTTP** - HyperText Transfer Protocol
**JSX** - JavaScript XML (React's template syntax, not part of LARC)
**LARC** - Lightweight Asynchronous Reactive Components
**MVC** - Model-View-Controller
**NPM** - Node Package Manager
**PAN** - Publish-and-subscribe Asynchronous Notification
**REST** - Representational State Transfer
**SPA** - Single-Page Application
**SSR** - Server-Side Rendering
**UI** - User Interface
**URL** - Uniform Resource Locator
**VDOM** - Virtual DOM
**W3C** - World Wide Web Consortium
**WHATWG** - Web Hypertext Application Technology Working Group

## Related Concepts

**Component Lifecycle**
See *Lifecycle* and *Lifecycle Callback*.

**Custom Events**
Events created via `new CustomEvent()` rather than browser-generated events. PAN bus events are custom events.

**Event-Driven Architecture**
An architectural pattern where components communicate through events rather than direct method calls. LARC's PAN bus enables event-driven architecture.

**Loose Coupling**
Design principle where components depend on abstractions (event types) rather than concrete implementations (specific components), making systems more flexible and maintainable.

**Separation of Concerns**
Design principle where different aspects of functionality are handled by different components. LARC components encapsulate specific UI concerns, communicating via well-defined events.

**Single Responsibility Principle**
Each component should have one clear purpose. LARC encourages focused components that do one thing well.

## Further Reading

**MDN Web Docs (developer.mozilla.org)**
Comprehensive reference for Web APIs, including Web Components, DOM manipulation, and JavaScript features.

**Web Components Specifications**
Official standards documents at w3.org and whatwg.org defining Custom Elements, Shadow DOM, and HTML Templates.

**LARC Documentation**
Complete API reference and guides at larc.dev.

**ECMAScript Specifications**
JavaScript language specifications at tc39.es.

---

This glossary covers core concepts needed to work effectively with LARC. For deeper exploration of specific topics, consult the main chapters of this manual and the reference materials listed above. Understanding these terms and their relationships helps you write clearer code, communicate more effectively with other developers, and leverage the full power of web standards in your applications.
