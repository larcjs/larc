# Hacker News Launch Checklist

**Target Launch Date:** _____________
**Target Time:** 7-9 AM PT (Tuesday-Thursday recommended)
**Launch Team:** _____________

---

## 📅 Timeline Overview

- **7 days before:** Complete all "1 Week Before" tasks
- **3 days before:** Complete all "3 Days Before" tasks
- **1 day before:** Complete all "Day Before" tasks
- **Launch day:** Follow "Launch Day" timeline
- **Post-launch:** Monitor for 48 hours

---

## ✅ 1 WEEK BEFORE LAUNCH

### Repository & Code

- [ ] All submodules updated to latest commits
- [ ] All tests passing in CI (261/261 core tests)
- [ ] No critical or high-severity npm audit issues
- [ ] Latest versions published to npm:
  - [ ] @larcjs/core@3.0.1 ✅
  - [ ] @larcjs/core@3.0.1 ✅
  - [ ] @larcjs/ui@3.0.1 ✅
  - [ ] @larcjs/core@3.0.1 ✅
- [ ] GitHub Actions workflows all green
- [ ] All TODO/FIXME comments resolved or documented

### Documentation

- [ ] README.md up to date with latest features
- [ ] All docs/ files reviewed and current
- [ ] API documentation complete
- [ ] CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md in place
- [ ] CHANGELOG.md updated with latest release
- [ ] All links in documentation verified working
- [ ] TypeScript documentation complete

### Examples & Demos

- [ ] Playground working and up-to-date (https://larcjs.github.io/larc/playground/)
- [ ] Hybrid dashboard demo working
- [ ] All examples/ demos tested and working
- [ ] Mobile responsiveness verified
- [ ] Examples work in incognito mode (no cache dependencies)

---

## ✅ 3 DAYS BEFORE LAUNCH

### Content Creation

- [ ] **Demo video recorded** (2-3 minutes)
  - [ ] Shows problem (Web Component silos)
  - [ ] Shows solution (PAN messaging)
  - [ ] Shows wow moment (hybrid dashboard, bundle savings)
  - [ ] Shows playground
  - [ ] Uploaded to YouTube/Vimeo with good title/description
  - [ ] Thumbnail created
  - [ ] Video URL added to README

- [ ] **HN post drafted:**
  - [ ] Title (60 chars max, compelling)
  - [ ] URL (direct to GitHub or playground)
  - [ ] First comment prepared (pin this)

- [ ] **FAQ prepared** for common questions:
  - [ ] "How is this different from React/Vue?"
  - [ ] "What's the browser support?"
  - [ ] "Is it production-ready?"
  - [ ] "How does bundle size compare?"
  - [ ] "Can I use TypeScript?"
  - [ ] "What's the learning curve?"
  - [ ] "Who's using this in production?"
  - [ ] "How does PAN compare to Redux/other state management?"

### Website & Infrastructure

- [ ] GitHub Pages deployed and current
- [ ] All CDN links working (test unpkg.com URLs)
- [ ] Site works on mobile devices
- [ ] Playground loads in <3 seconds
- [ ] SSL/HTTPS working correctly
- [ ] No broken images or assets
- [ ] Analytics set up (optional: Plausible, Simple Analytics)
- [ ] Error monitoring ready (optional: Sentry, LogRocket)

### Social Media Prep

- [ ] Twitter/X account ready (if applicable)
- [ ] LinkedIn post drafted (if applicable)
- [ ] Screenshots prepared for social sharing
- [ ] Hashtags prepared: #webcomponents #javascript #opensource

---

## ✅ DAY BEFORE LAUNCH

### Final Testing (Critical!)

**Test on multiple browsers:**
- [ ] Chrome (desktop) - Latest version
- [ ] Firefox (desktop) - Latest version
- [ ] Safari (desktop) - Latest version
- [ ] Edge (desktop) - Latest version
- [ ] Chrome (mobile) - iOS
- [ ] Safari (mobile) - iOS
- [ ] Chrome (mobile) - Android

**Test all key pages in incognito/private mode:**
- [ ] Main README renders correctly on GitHub
- [ ] Playground loads and works
- [ ] Examples work
- [ ] Documentation site loads
- [ ] All links work (click every link!)
- [ ] Demo video plays

**Test specific scenarios:**
- [ ] Clone fresh repo and follow Quick Start
- [ ] Install from npm and verify it works
- [ ] TypeScript imports work correctly
- [ ] CDN imports work
- [ ] Examples work without local server (if applicable)

### Performance Check

- [ ] Playground loads in <3 seconds on 3G
- [ ] Core bundle size: 40KB minified (128KB unminified) (verify on unpkg.com)
- [ ] No console errors on any page
- [ ] No 404s in network tab
- [ ] Lighthouse score >90 (optional but nice)

### Team Coordination

- [ ] Team members available on launch day?
- [ ] Backup person assigned if primary unavailable
- [ ] Communication channel set up (Slack, Discord, etc.)
- [ ] Response strategy discussed
- [ ] Roles assigned:
  - [ ] Technical questions responder: _____________
  - [ ] Community/enthusiasm responder: _____________
  - [ ] Bug report triager: _____________

### HN Post Review

- [ ] Title finalized (test on friends for clarity)
- [ ] First comment refined and ready to paste
- [ ] FAQ answers ready to copy/paste
- [ ] Screenshots ready for threads that ask
- [ ] Comparison tables ready (LARC vs React, etc.)

---

## ✅ LAUNCH DAY

### Pre-Launch (6:00 AM PT)

- [ ] Double-check all services are up:
  - [ ] GitHub.com accessible
  - [ ] GitHub Pages working
  - [ ] npm packages available
  - [ ] CDN links working
- [ ] Demo video still accessible
- [ ] Team members online and ready
- [ ] Notifications enabled for GitHub issues/discussions
- [ ] Close all unrelated tabs, prepare to focus

### Launch (7:00-9:00 AM PT)

**Optimal time: 7:30 AM PT on Tuesday, Wednesday, or Thursday**

- [ ] Post to Hacker News:
  - [ ] Go to https://news.ycombinator.com/submit
  - [ ] Title: ________________________________________________
  - [ ] URL: https://github.com/larcjs/larc (or playground URL)
  - [ ] Submit!

- [ ] Immediately post first comment (within 2 minutes):
  ```
  Hi HN! I built LARC to solve the "Web Component coordination problem."

  Quick demo: Load one script tag, use <pan-card> in HTML, done. No build step.

  The killer feature is PAN (Page Area Network) - a message bus that lets
  components coordinate without knowing about each other. Mix React, Vue,
  and LARC components on the same page.

  Try it: https://larcjs.github.io/larc/playground/

  Tech: 261 passing tests, TypeScript support, 5KB core, zero dependencies.

  Happy to answer questions!
  ```

- [ ] Save HN post URL
- [ ] Share HN post URL with team

### First 2 Hours (Critical Window)

**Goal: Respond to EVERY comment within 10 minutes**

- [ ] Set timer: Check HN every 5 minutes
- [ ] Respond thoughtfully to every comment
- [ ] Be humble, grateful, and educational
- [ ] Don't be defensive if criticized
- [ ] Fix any obvious bugs immediately
- [ ] Update README if confusion is widespread
- [ ] Thank people for compliments and feedback

**Response templates ready:**

*For "How is this different from X?"*
> Great question! The main difference is [specific technical difference]. LARC is designed to complement React/Vue, not replace them. You keep your framework for complex UIs and use LARC for [specific use case].

*For "What about Y concern?"*
> That's a valid concern. Here's how we handle it: [technical explanation]. We also document this in [link to docs].

*For bug reports:*
> Thanks for catching this! Can you share more details? [specific questions]. I'll look into this right away.

*For positive feedback:*
> Thank you! That means a lot. If you try it out, I'd love to hear your feedback.

### Hours 2-6

- [ ] Continue monitoring, but can reduce to every 15-30 minutes
- [ ] Address any critical bugs or issues
- [ ] Update FAQ if common questions emerge
- [ ] Track metrics:
  - [ ] HN points
  - [ ] Comments count
  - [ ] GitHub stars
  - [ ] npm downloads
  - [ ] Website traffic

### Evening (After 6 hours)

- [ ] Final check-in before EOD
- [ ] Respond to any unanswered comments
- [ ] Document any issues to address tomorrow
- [ ] Thank the team
- [ ] Get rest!

---

## ✅ POST-LAUNCH (Days 1-2)

### Day 1 Evening / Day 2

- [ ] Respond to all HN comments within 24 hours
- [ ] Address any critical bugs reported
- [ ] Monitor GitHub issues/discussions
- [ ] Thank contributors and early adopters
- [ ] Track metrics and record for future reference
- [ ] Write brief post-mortem (what went well, what to improve)

### Days 2-7

- [ ] Continue responding to comments daily
- [ ] Triage and prioritize reported issues
- [ ] Update documentation based on feedback
- [ ] Plan next steps based on community response
- [ ] Send thank-you notes to significant contributors

---

## 📊 Success Metrics

Track these metrics before/after launch:

**Before Launch:**
- GitHub stars: ______
- npm downloads (weekly): ______
- Twitter followers: ______

**After Launch (24h):**
- HN points: ______
- HN comments: ______
- GitHub stars: ______
- npm downloads: ______
- Website visitors: ______

**After Launch (1 week):**
- Total GitHub stars: ______
- Total npm downloads: ______
- Issues opened: ______
- PRs submitted: ______
- Community discussions: ______

---

## 🚨 Emergency Contacts

**If something goes wrong:**

- [ ] GitHub down: Check https://www.githubstatus.com/
- [ ] npm down: Check https://status.npmjs.org/
- [ ] CDN down: Check unpkg.com status
- [ ] Website down: Check GitHub Pages status

**Rollback plan:**
- [ ] If critical bug found: Can we hotfix? Or acknowledge and promise fix?
- [ ] If infrastructure down: Link to backup locations
- [ ] If overwhelmed: Tag in backup team member

---

## 📝 Post-Launch Retrospective

**Complete within 1 week of launch:**

### What Went Well
- _______________________________
- _______________________________
- _______________________________

### What Could Improve
- _______________________________
- _______________________________
- _______________________________

### Action Items
- [ ] _______________________________
- [ ] _______________________________
- [ ] _______________________________

### Community Feedback Themes
- _______________________________
- _______________________________
- _______________________________

---

## 🎉 Celebration!

**Don't forget to celebrate the launch!**

- [ ] Team celebration (virtual or in-person)
- [ ] Document the journey (blog post, Twitter thread)
- [ ] Thank everyone who helped
- [ ] Plan the next milestone

---

## 📚 Resources

- HN Guidelines: https://news.ycombinator.com/newsguidelines.html
- Show HN: https://news.ycombinator.com/showhn.html
- HN FAQ: https://news.ycombinator.com/newsfaq.html
- Launch timing research: Tuesday-Thursday, 7-9 AM PT is optimal

---

**Good luck! You've got this! 🚀**

*Remember: Be humble, be helpful, be responsive. The HN community appreciates authenticity and technical depth.*
