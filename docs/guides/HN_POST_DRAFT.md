# Hacker News Post - LARC Launch

## 🎯 Title Options (Pick One)

### Option 1: Direct & Technical (Recommended)
**Show HN: LARC – Web Components with zero-build dev and PAN messaging**
(63 chars - under 80 limit)

### Option 2: Problem-Focused
**Show HN: Solving the Web Component coordination problem with PAN**
(67 chars)

### Option 3: Benefit-Focused
**Show HN: Framework-agnostic components that work everywhere (3.6KB)**
(69 chars)

### Option 4: Pragmatic
**Show HN: Web Components framework – reduce React bundle by 60%**
(65 chars)

---

## 📝 First Comment (Post within 2 minutes of submission)

```
Hi HN! Creator here.

LARC solves two pain points I hit when building with Web Components:

1. **Coordination:** Web Components are silos. They can't communicate without
   tight coupling. PAN (Page Area Network) provides a lightweight message bus
   so components coordinate without knowing about each other.

2. **Development friction:** No one wants to run webpack to add a card component.
   LARC loads components automatically—just write HTML and refresh your browser.

Technical highlights:
• 3.6KB autoloader entry (or ~9KB full core-lite runtime), zero dependencies
• 426 browser executions (Chromium, Firefox, WebKit)
• Works with React, Vue, Svelte—mix and match
• TypeScript support
• Published on npm (@larcjs/core@3.0.1)

Live playground: https://larcjs.com/playground/

The "killer" demo is the hybrid dashboard—React, Vue, and LARC components
on the same page, coordinating via PAN messages. No framework knows
about the others.

Latest updates: unified playground (Gallery/Builder/Editor), site-wide dark mode
with persisted themes, and refreshed hybrid dashboard demo.

Philosophy: Zero-build in dev for fast iteration. Optional build in prod
for optimization. Framework complement, not replacement.

Happy to answer questions!

GitHub: https://github.com/larcjs/larc
Docs: https://larcjs.com/
```

---

## 🎯 Alternative First Comments

### Shorter Version (If needed)
```
Hi HN! Built LARC to solve the Web Component "silo problem."

The core insight: Web Components need a coordination layer. PAN (Page Area Network)
provides lightweight pub/sub messaging so components communicate without coupling.

Tech: 3.6KB autoloader entry (or ~9KB full core-lite runtime), 426 browser executions, works with React/Vue/Svelte, TypeScript support.

Playground: https://larcjs.com/playground/
Hybrid demo: React + Vue + LARC components coordinating via PAN messages
(https://larcjs.com/examples/hybrid-dashboard/).

Latest updates: unified playground, site-wide dark mode, refreshed hybrid dashboard demo.

Zero-build dev, optional build prod. Complement frameworks, don't replace them.

Questions welcome!
```

### With More Context Version
```
Hi HN! I'm the creator of LARC.

**The problem:** Web Components are great for encapsulation but terrible for
coordination. Every component is an island. Making them work together requires
custom integration code, defeating the purpose of reusable components.

**The solution:** PAN (Page Area Network) - a message bus for Web Components.

Think MQTT for the browser. Components publish and subscribe to topics.
A theme toggle publishes "theme.changed", cards/tables/modals subscribe
and update automatically. No coupling, no imports, no framework required.

**Why it matters:**
• Reduce framework overhead 60%+ (3.6KB autoloader entry or ~9KB full core-lite runtime vs ~140KB React)
• True framework interop (React, Vue, Svelte on same page)
• Zero build in dev (write code, refresh browser)
• No vendor lock-in (it's just Web Components + messaging)

**What's new (this week):**
• create-larc-app CLI tool
• Component registry with web UI
• VS Code extension

**Technical details:**
• 426 browser executions (Chromium, Firefox, WebKit)
• 0 vulnerabilities (npm audit)
• TypeScript support
• Published to npm (@larcjs/core@3.0.1)

**Try it:**
Playground: https://larcjs.com/playground/
Hybrid demo: https://larcjs.com/examples/hybrid-dashboard/

**Get started:**
```bash
npx create-larc-app my-app
```

Philosophy: LARC is designed for zero-build development while supporting
optimized builds for production. Fast iteration + optimal delivery.

I'm here all day to answer questions!

Docs: https://larcjs.com/
GitHub: https://github.com/larcjs/larc
```

---

## 📋 Preparation Checklist

Before posting:

- [ ] Choose title (Option 1 recommended)
- [ ] Choose first comment style (Standard or Shorter)
- [ ] Verify all links work
- [ ] Have FAQ.md open for quick copy/paste
- [ ] Test playground loads properly
- [ ] Have code examples ready to share
- [ ] Clear schedule for 2-hour response window
- [ ] Team members on standby
- [ ] GitHub repo ready for traffic

---

## 🎯 Key Talking Points

Keep these ready for comments:

1. **vs React/Vue:** Complement, not replace. Keep React for complex UIs.
2. **Why Web Components:** Only true framework-agnostic solution.
3. **Production ready:** 426 browser executions, 0 vulnerabilities, v3.0.1 on npm.
4. **Bundle size:** 3.6KB autoloader entry (or ~9KB full core-lite runtime) vs ~140KB (React) or ~90KB (Vue).
5. **PAN bus:** Like MQTT for browser—pub/sub messaging.
6. **Zero build:** Write .mjs files, refresh browser. No webpack required.
7. **Learning curve:** HTML + vanilla JS knowledge is enough.
8. **TypeScript:** Full support with @larcjs/core-types.
9. **Browser support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.
10. **Community:** Young (Nov 2024) but growing. Early adopter opportunity.

---

## ⏰ Launch Timing

**Optimal times (Pacific Time):**
- Tuesday: 7:30 AM - 9:00 AM PT
- Wednesday: 7:30 AM - 9:00 AM PT
- Thursday: 7:30 AM - 9:00 AM PT

**Avoid:**
- Monday (slower engagement)
- Friday (weekend approaching)
- Weekends (low HN traffic)
- After 12 PM PT (less visibility)

---

## 🔗 Important Links (Keep Handy)

- Main repo: https://github.com/larcjs/larc
- Core repo: https://github.com/larcjs/core
- Playground: https://larcjs.com/playground/
- Docs site: https://larcjs.com/
- Examples: https://larcjs.com/examples/
- npm: https://npmjs.com/package/@larcjs/core
- Discussions: https://github.com/larcjs/larc/discussions

---

## 🚀 Ready to Launch!

When ready to post:
1. Go to: https://news.ycombinator.com/submit
2. Enter title (Option 1 recommended)
3. Enter URL: https://github.com/larcjs/larc
4. Submit
5. **Immediately** post first comment (within 2 minutes)
6. Share HN post URL with team
7. Begin monitoring every 5 minutes
8. Respond to every comment within 10 minutes (first 2 hours)

**Good luck! 🎉**
