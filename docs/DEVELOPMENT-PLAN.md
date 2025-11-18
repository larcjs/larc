# LARC Development Plan

## Overview

This plan outlines the phased development of the LARC ecosystem, prioritized by value and dependencies.

**Guiding Principles:**
- Ship early, iterate often
- Validate assumptions with real usage
- Start with highest value / lowest effort
- Build in public, get feedback

---

## Phase 1: Foundation (Weeks 1-2)

**Goal:** Establish type system and prove TypeScript integration works

### 1.1 Core Types Package ⭐ **PRIORITY**

**Why first:** Foundational, unblocks TypeScript users, proves the opt-in model

- [ ] Create `@larcjs/core-types` repository
- [ ] Implement type definitions:
  - [ ] `types/message.d.ts` (PanMessage, PublishOptions)
  - [ ] `types/subscription.d.ts` (SubscriptionCallback, etc.)
  - [ ] `types/config.d.ts` (AutoloadConfig, PathConfig)
  - [ ] `components/pan-client.d.ts`
  - [ ] `components/pan-bus.d.ts`
  - [ ] `components/pan-autoload.d.ts`
  - [ ] `index.d.ts` (re-exports)
- [ ] Write package.json with peer dependency
- [ ] Create README with usage examples
- [ ] Publish to npm
- [ ] Test integration in a TypeScript project

**Deliverable:** `npm install -D @larcjs/core-types` works

**Success Criteria:**
- TypeScript projects get full autocomplete
- Zero runtime impact (types only)
- Clear documentation

**Time Estimate:** 3-4 days

### 1.2 Update Core Package

- [ ] Add `types` field to core/package.json pointing to @larcjs/core-types
- [ ] Update core README to mention TypeScript support
- [ ] Add TypeScript section to documentation

**Time Estimate:** 1 day

### 1.3 Components Types Package

- [ ] Create `@larcjs/components-types` repository
- [ ] Generate types for all components (can automate with tsc)
- [ ] Publish to npm

**Time Estimate:** 2-3 days

---

## Phase 2: Framework Integration (Weeks 3-4)

**Goal:** Prove LARC works with existing frameworks, starting with React (largest community)

### 2.1 React Adapter ⭐ **PRIORITY**

**Why React first:** Largest framework community, proves the adapter model

- [ ] Create `@larcjs/react-adapter` repository
- [ ] Implement hooks:
  - [ ] `usePanClient()` - Get/create client instance
  - [ ] `usePanSubscribe()` - Subscribe with auto-cleanup
  - [ ] `usePanPublish()` - Get publish function
  - [ ] `usePanState()` - Synced state via PAN (bonus)
- [ ] Write comprehensive tests (React Testing Library)
- [ ] Create example app (Vite + React)
- [ ] Write documentation
- [ ] Publish to npm

**Deliverable:** Working React + LARC demo app

**Success Criteria:**
- Clean API that feels "React-native"
- No memory leaks (proper cleanup)
- Works with React 18+ features (Suspense, Concurrent)
- Example app demonstrates value

**Time Estimate:** 5-7 days

### 2.2 Vue Adapter

**Why Vue second:** Second largest community, different patterns (composition API)

- [ ] Create `@larcjs/vue-adapter` repository
- [ ] Implement composables:
  - [ ] `usePanClient()`
  - [ ] `usePanSubscribe()`
  - [ ] `usePanPublish()`
- [ ] Write tests (Vue Test Utils)
- [ ] Create example app (Vite + Vue)
- [ ] Documentation
- [ ] Publish to npm

**Time Estimate:** 4-5 days

### 2.3 Documentation Site Update

- [ ] Add "Framework Integration" section to docs
- [ ] Include React example walkthrough
- [ ] Include Vue example walkthrough
- [ ] Add "When to use LARC with frameworks" guide

**Time Estimate:** 2 days

---

## Phase 3: Production Readiness (Weeks 5-6)

**Goal:** Help users deploy optimized production builds

### 3.1 Production Build Guide ⭐ **PRIORITY**

- [ ] Write `docs/production.md` covering:
  - [ ] Vite setup (detailed)
  - [ ] Rollup setup
  - [ ] esbuild setup
  - [ ] No-build CDN strategy
  - [ ] Performance comparison
  - [ ] Deployment targets (Netlify, Vercel, etc.)
- [ ] Create example production configs for each tool
- [ ] Document bundle size benchmarks

**Time Estimate:** 3-4 days

### 3.2 Vite Plugin (Optional)

**Nice to have:** Streamlines LARC + Vite setup

- [ ] Create `@larcjs/vite-plugin`
- [ ] Features:
  - [ ] Auto-configure PAN bus
  - [ ] Component autoloading in dev
  - [ ] Optimized bundling for production
- [ ] Documentation
- [ ] Publish to npm

**Time Estimate:** 3-5 days (can defer)

### 3.3 Performance Testing

- [ ] Create benchmark suite
- [ ] Test bundle sizes (unbundled vs bundled)
- [ ] Test load times (dev vs prod)
- [ ] Document results in production guide

**Time Estimate:** 2-3 days

---

## Phase 4: Developer Experience (Weeks 7-8)

**Goal:** Make it easy to start and scaffold new projects

### 4.1 CLI Tool

- [ ] Create `@larcjs/cli` (create-larc-app)
- [ ] Templates:
  - [ ] Vanilla JS starter
  - [ ] React + LARC starter
  - [ ] Vue + LARC starter
  - [ ] TypeScript starter
- [ ] Commands:
  - [ ] `create-larc-app my-app`
  - [ ] `--template react|vue|vanilla|typescript`
- [ ] Interactive prompts
- [ ] Documentation

**Time Estimate:** 5-7 days

### 4.2 Test Utils

- [ ] Create `@larcjs/test-utils`
- [ ] Helpers for testing PAN components
- [ ] Mock bus for unit tests
- [ ] Utilities for integration tests
- [ ] Examples with popular test frameworks

**Time Estimate:** 3-4 days

### 4.3 VS Code Extension (Optional)

**Nice to have:** Snippets and IntelliSense

- [ ] LARC component snippets
- [ ] PAN message schema validation
- [ ] Component path autocomplete

**Time Estimate:** 5-7 days (can defer)

---

## Phase 5: Ecosystem Growth (Weeks 9-12)

**Goal:** Build community, examples, and remaining adapters

### 5.1 Example Applications

Build 3-5 real apps demonstrating different use cases:

- [ ] **Dashboard app** - Data visualization, real-time updates
- [ ] **E-commerce cart** - State management across components
- [ ] **Chat application** - Pub/sub messaging patterns
- [ ] **Form builder** - Complex component interaction
- [ ] **Admin panel** - CRUD operations, routing

**Time Estimate:** 2-3 days each

### 5.2 Remaining Framework Adapters

- [ ] Angular adapter (`@larcjs/angular-adapter`)
- [ ] Svelte adapter (`@larcjs/svelte-adapter`)
- [ ] Solid.js adapter (if there's demand)

**Time Estimate:** 4-5 days each

### 5.3 Component Library Expansion

- [ ] Audit existing components in @larcjs/components
- [ ] Add missing common patterns
- [ ] Create component type definitions
- [ ] Improve documentation with live examples

**Time Estimate:** Ongoing

### 5.4 DevTools Enhancements

- [ ] Update Chrome extension for new features
- [ ] Add performance profiling
- [ ] Add message recording/replay
- [ ] Publish updates

**Time Estimate:** 5-7 days

### 5.5 LARC Playground ⭐ **HIGH VALUE**

**Goal:** Interactive component explorer and prototyping tool

**Why this matters:**
- Best marketing tool (live demos)
- Great onboarding experience
- Helps users learn components
- Dogfoods LARC itself
- 70% of full builder value for 10% of work

**Features:**
- [ ] Component sidebar (drag or click to add)
- [ ] Live canvas (see components working)
- [ ] Properties panel (edit props, styles)
- [ ] PAN bus visualizer (see messages flowing)
- [ ] Code export (copy generated HTML)
- [ ] Share links (save to URL/localStorage)
- [ ] Responsive preview (mobile/tablet/desktop)

**Technical:**
- [ ] Built entirely with LARC components
- [ ] Uses flexbox for layout
- [ ] Real-time preview (no build step)
- [ ] Serializable to JSON
- [ ] Embeddable in docs

**Integration:**
- [ ] Add to documentation site
- [ ] Use in "Getting Started" guide
- [ ] Embed in component docs
- [ ] Create tutorial videos using it

**Deliverable:** `playground.larcjs.com` or `/playground` on docs site

**Success Criteria:**
- Users can prototype simple apps in <5 minutes
- Clean HTML export
- Works on mobile
- Feels fast and responsive

**Time Estimate:** 7-10 days

**Note:** This is NOT a full app builder (no hosting, no complex state management, no user accounts). It's a prototyping/learning tool. Full builder considered for future based on demand.

---

## Phase 6: Community & Polish (Ongoing)

**Goal:** Build awareness, gather feedback, iterate

### 6.1 Documentation Polish

- [ ] Add interactive code examples (CodeSandbox embeds)
- [ ] Create video tutorials
- [ ] Write blog posts / tutorials
- [ ] API reference completion

### 6.2 Community Building

- [ ] Create Discord/Slack community
- [ ] Start GitHub Discussions
- [ ] Write "Getting Started" guide for contributors
- [ ] Create issue templates
- [ ] Add contribution guidelines

### 6.3 Marketing & Outreach

- [ ] Dev.to articles
- [ ] Hacker News launch post
- [ ] Reddit r/javascript post
- [ ] Twitter presence
- [ ] Reach out to framework communities

### 6.4 Feedback Loop

- [ ] Collect user feedback
- [ ] Prioritize feature requests
- [ ] Fix bugs
- [ ] Iterate on API based on real usage

---

## Success Metrics

Track these to measure progress:

**Technical:**
- [ ] All core packages published to npm
- [ ] Test coverage >80%
- [ ] Zero critical bugs
- [ ] Documentation complete

**Adoption:**
- [ ] 100 npm downloads/week (early)
- [ ] 500 npm downloads/week (growth)
- [ ] 10 GitHub stars/week
- [ ] 5 community-built examples

**Quality:**
- [ ] 5-10 production users
- [ ] Positive feedback in issues/discussions
- [ ] Framework integration examples work smoothly

---

## Priority Matrix

### Must Have (Phase 1-2)
- @larcjs/core-types ✅
- @larcjs/components-types ✅
- @larcjs/react-adapter ✅
- Production build guide ✅

### Should Have (Phase 3-4)
- @larcjs/vue-adapter
- @larcjs/cli
- @larcjs/test-utils
- Example applications (2-3)
- LARC Playground ⭐

### Nice to Have (Phase 5-6)
- @larcjs/vite-plugin
- @larcjs/angular-adapter
- @larcjs/svelte-adapter
- VS Code extension
- More example apps

### Future (Post v1.0)
- Full WYSIWYG App Builder (if demand validates)

---

## Dependencies Graph

```
Phase 1: Core Types
    ↓
Phase 2: Framework Adapters (requires types)
    ↓
Phase 3: Production Guide (requires adapters for examples)
    ↓
Phase 4: CLI (requires templates)
    ↓
Phase 5: Ecosystem Growth (requires stable foundation)
    ↓
Phase 6: Community (ongoing, starts early)
```

---

## Risk Mitigation

**Risk:** TypeScript types don't match runtime
**Mitigation:** Generate types from JSDoc, automated testing

**Risk:** Framework adapters feel "un-native"
**Mitigation:** Get early feedback from framework experts, iterate

**Risk:** Production builds too complex
**Mitigation:** Provide working examples, video tutorials

**Risk:** Low adoption
**Mitigation:** Focus on specific use cases, create compelling demos

**Risk:** Maintenance burden
**Mitigation:** Start small, expand based on demand, automate testing

---

## Next Immediate Actions

1. **This week:** Create @larcjs/core-types, publish to npm
2. **Next week:** Start React adapter, create demo app
3. **Week 3:** Write production build guide
4. **Week 4:** Gather early feedback, iterate

---

## Resources Needed

**Development:**
- GitHub organization (✅ have it)
- npm organization (✅ have it)
- CI/CD (GitHub Actions)
- Domain for docs site (optional)

**Skills:**
- TypeScript (types)
- React/Vue/Angular (adapters)
- Build tools (Vite, Rollup)
- Technical writing (docs)
- DevRel (community)

**Tools:**
- Testing frameworks
- Bundlers
- Documentation generators (VitePress, Docusaurus)

---

## Timeline Summary

```
Weeks 1-2:   Foundation (types)
Weeks 3-4:   Framework integration (React, Vue)
Weeks 5-6:   Production readiness
Weeks 7-8:   Developer experience (CLI, test utils)
Weeks 9-12:  Ecosystem growth (examples, adapters, playground)
Week 12+:    Community & iteration
```

**Total to MVP:** ~6 weeks (phases 1-3)
**Total to v1.0:** ~12 weeks (all phases)

This is aggressive but achievable with focused effort. Adjust based on available time and feedback.

---

## Future Ideas (Post v1.0)

### Full LARC App Builder (WYSIWYG)

**Concept:** Drag-and-drop visual builder for creating complete LARC applications

**Features:**
- Full page/app builder (not just component explorer)
- Drag-and-drop from component toolbar
- Floating properties panel for styles, settings
- Flexbox-based layout (components snap to borders)
- Live preview as you build
- State management visual editor
- PAN bus message flow designer
- Export complete applications
- Potentially: hosting, user accounts, collaboration

**Why later:**
- Massive scope (would compete with Webflow/Framer)
- Requires stable, mature LARC foundation
- Need community feedback first
- Want to validate demand via Playground adoption
- Could be separate company/product

**Decision point:**
- After 6-12 months of v1.0 in production
- If Playground shows strong demand
- If users request visual builder features
- If resources/team available

**Considerations:**
- Keep generated code clean and hand-editable
- Support round-trip (visual → code → visual)
- Target specific use cases (dashboards, admin panels)
- Don't try to replace all coding
- Could be community-driven plugin

**Reference:** See conversation notes on visual builder discussion for full analysis.
