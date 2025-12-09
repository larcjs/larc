# Hybrid Dashboard Demo

**React + Vue + LARC Components - All Working Together**

This demo proves LARC's core value proposition: **reduce framework overhead by mixing Web Components with React/Vue for a 60%+ smaller bundle.**

## 🎯 What This Demonstrates

### The Problem
Traditional React dashboards bundle everything:
- React + ReactDOM: 172 KB
- Material-UI or Ant Design: 300-500 KB
- Chart library: 100-180 KB
- State management: 20-50 KB
- **Total: 600-900 KB before your code**

### The Solution
Use LARC + selective framework usage:
- PAN Core: 5 KB
- React (chart only): 172 KB
- Vue (filters only): 100 KB
- LARC components (on-demand): 45 KB
- **Total: ~320 KB (60% savings)**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           PAN Message Bus (5 KB)            │
├─────────────┬──────────────┬────────────────┤
│   React     │     Vue      │     LARC       │
│  Component  │  Component   │   Components   │
├─────────────┼──────────────┼────────────────┤
│ Analytics   │   Filters    │ • Header       │
│   Chart     │    Panel     │ • Sidebar      │
│ (172 KB)    │  (100 KB)    │ • Stats Cards  │
│             │              │ • Data Table   │
│             │              │  (45 KB total) │
└─────────────┴──────────────┴────────────────┘
```

### Components Breakdown

| Component | Technology | Why? |
|-----------|-----------|------|
| **Header** | LARC | Simple, doesn't need framework overhead |
| **Sidebar** | LARC | Static navigation, no complex state |
| **Stats Cards** | LARC | Display-only components |
| **Filters Panel** | **Vue** | Complex reactive forms (Vue's strength) |
| **Analytics Chart** | **React** | Rich interactivity (React's strength) |
| **Data Table** | LARC | Standard CRUD operations |

**Key Insight:** Use frameworks only where they add value. For 80% of UI (cards, tables, modals), LARC is enough.

## 🔌 PAN Message Bus Coordination

All three technologies communicate via PAN messages:

```javascript
// Vue publishes filter changes
filters:changed → { dateRange: '7d', metric: 'users' }

// React chart receives and updates
// LARC table receives and re-filters
// No tight coupling between components!
```

**Without PAN:** Each component would need custom integration code, negating reusability.

**With PAN:** Components are truly independent and composable.

## 🚀 Running the Demo

### Option 1: Local Development

```bash
# From repo root
python3 -m http.server 8000

# Open browser
open http://localhost:8000/examples/hybrid-dashboard/
```

### Option 2: GitHub Pages

Once deployed: `https://larcjs.github.io/larc/examples/hybrid-dashboard/`

## 📊 Bundle Size Comparison

The demo shows a real-time comparison banner at the top:

### Traditional React Approach
```
React + ReactDOM:     172 KB
Material-UI:          450 KB
Chart.js + wrapper:   180 KB
State Management:      35 KB
────────────────────────────
Total:                837 KB ❌
```

### Hybrid LARC Approach
```
PAN Core Bus:           5 KB
React (chart only):   172 KB
Vue (filters only):   100 KB
LARC Components:       45 KB
────────────────────────────
Total:                322 KB ✅

Savings: 515 KB (61% smaller)
```

## 🎨 Features Demonstrated

### 1. Framework Interoperability
- React component renders chart
- Vue component renders filters
- LARC components render everything else
- All coordinate via PAN messages

### 2. Loose Coupling
- No component imports another
- No prop drilling
- No shared state managers
- Just topic-based messaging

### 3. Theme Coordination
- Click "Toggle Theme" in header
- All components update (React, Vue, LARC)
- Demonstrates cross-framework state sync

### 4. Data Flow
- Vue filters publish changes
- React chart receives and updates
- LARC table receives and re-filters
- Click chart datapoints → publishes event

## 💡 Key Takeaways

### When to Use Each Technology

**Use LARC for:**
- ✅ Cards, modals, dropdowns, tabs
- ✅ Data tables (sorting, filtering, pagination)
- ✅ Navigation, sidebars, headers
- ✅ Forms (unless extremely complex)
- ✅ Static display components

**Use React for:**
- 🔧 Rich interactive charts/visualizations
- 🔧 Complex multi-step wizards
- 🔧 Real-time collaborative features
- 🔧 Heavy client-side business logic

**Use Vue for:**
- 🔧 Complex reactive forms
- 🔧 Admin panels with lots of inputs
- 🔧 Dynamic filter/search UIs

**Best Practice:**
Mix them! Use frameworks for 20% of UI that needs framework power, LARC for the other 80%.

## 🧪 Testing PAN Coordination

### Experiment 1: Filter Changes
1. Change any filter in Vue panel (top)
2. Watch console: `📊 React Chart received filter change`
3. Chart updates metric (Users → Revenue)
4. Table could re-filter (LARC component)

### Experiment 2: Chart Interaction
1. Click any data point on React chart
2. Watch console: `📈 Chart datapoint clicked`
3. Other components could respond (show modal, filter table, etc.)

### Experiment 3: Theme Toggle
1. Click "Toggle Theme" button (header)
2. Watch all components update simultaneously
3. React chart, Vue filters, LARC components all change

**No tight coupling. No prop drilling. Just messages.**

## 📁 File Structure

```
hybrid-dashboard/
├── index.html           # Main page with dashboard layout
├── react-chart.js       # React component (analytics chart)
├── vue-filters.js       # Vue component (filters panel)
└── README.md           # This file
```

## 🎓 Learning Goals

After exploring this demo, you should understand:

1. **How to mix frameworks** without conflicts
2. **How PAN messaging coordinates** disparate technologies
3. **Why Web Components failed** without coordination (silo problem)
4. **How LARC solves it** with standardized messaging
5. **Bundle size benefits** of selective framework usage

## 🔗 Related Demos

- **Pure LARC Dashboard** - Compare bundle size with no frameworks
- **React Integration Example** - Deep dive on React + PAN
- **Vue Integration Example** - Deep dive on Vue + PAN

## 🤝 Contributing

Want to add more framework examples?
- Angular integration
- Svelte integration
- Solid integration

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**Built to prove a point:** Web Components + PAN messaging can reduce real-world bundle sizes by 60%+, while keeping the power of React/Vue where you need it.
