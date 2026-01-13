# LARC Playground - Unified System

## Overview

The new unified playground combines **three powerful modes** into one cohesive experience:

1. **📚 Gallery Mode** - Browse and explore pre-built component examples
2. **🔨 Builder Mode** - Visual drag-and-drop component builder
3. **💻 Editor Mode** - CodePen-style live code editor

## What's New?

### ✅ Issues Fixed

1. **Property Changes Now Apply Correctly**
   - Fixed event listeners for attribute updates
   - Properties update on change (checkboxes/selects) or blur (textareas)
   - Visual feedback when properties are updated

2. **CSS Styling Works Properly**
   - Click "Apply Styles" button to apply CSS to components
   - CSS presets for quick styling (Card, Gradient, Shadow, Bordered)
   - Clear visual feedback when styles are applied
   - Styles persist across mode switches

3. **Actions/Events System Functional**
   - Add custom event handlers to components
   - Support for click, hover, focus, and other DOM events
   - Publish to PAN bus directly from UI
   - Console logging and alerts for debugging

4. **Clear Mode Separation**
   - Top-level tabs clearly show which mode you're in
   - Each mode has its own dedicated UI
   - Easy switching between modes with example preservation

### 🆕 New Features

#### Gallery Mode
- **Visual Example Browser** - See all 20+ examples in a beautiful grid
- **Search & Filter** - Find examples quickly
- **Quick Actions** - Open any example in Builder or Editor with one click
- **Preview** - Open examples in a new window for fullscreen testing

#### Builder Mode
- **Component Palette** - Drag components from sidebar
- **Visual Canvas** - See components render live
- **3-Tab Properties Panel**:
  - **Properties** - Edit component attributes with type-aware inputs
  - **CSS** - Style containers with live preview
  - **Actions** - Bind events and PAN bus messages
- **Code Export** - Export your creation as standalone HTML

#### Editor Mode
- **3-Pane Code Editor** - HTML, CSS, JavaScript tabs
- **Live Preview** - See changes as you type (1s debounce)
- **Auto-run** - Changes apply automatically
- **Export** - Download as standalone HTML file
- **Format** - Basic code formatting
- **Fullscreen Preview** - Test in fullscreen mode

## File Structure

```
playground/
├── index-new.html              # New unified playground entry point
├── playground-unified.mjs      # Main controller for all three modes
├── styles/
│   ├── playground-unified.css  # Unified styles for all modes
│   └── playground.css          # Original styles (still used by components)
├── components/                 # Existing components (reused)
│   ├── pg-palette.mjs
│   ├── pg-canvas.mjs
│   ├── pg-properties.mjs
│   ├── pg-exporter.mjs
│   └── pg-bus-monitor.mjs
└── examples.mjs                # 20+ pre-built examples
```

## How to Use

### Accessing the Playground

**Option 1: Direct Access**
```
https://larcjs.com/playground/index-new.html
```

**Option 2: Replace Current Playground**
```bash
cd /home/cdr/domains/larcjs.com/www/larc/playground
cp index.html index-old.html  # Backup
cp index-new.html index.html  # Replace
```

### Gallery Mode

1. Browse the example cards
2. Use search box to find specific examples
3. Click action buttons:
   - **🔨 Open in Builder** - Load in visual builder
   - **💻 Open in Editor** - Load code in editor
   - **👁 Preview** - Open in new window

### Builder Mode

1. **Add Components**:
   - Click component from left sidebar palette
   - Component appears on canvas
   - Select component to edit properties

2. **Edit Properties** (Right Panel):
   - **Properties Tab** - Edit attributes
     - Text inputs for strings
     - Checkboxes for booleans
     - Textareas for JSON/objects
     - Changes apply on blur/change
   - **CSS Tab** - Style the component
     - Write custom CSS in textarea
     - Use presets for quick styles
     - Click "Apply Styles" to see changes
   - **Actions Tab** - Add event handlers
     - Choose event (click, hover, etc.)
     - Choose action (PAN publish, console, alert)
     - Add value/message
     - Click "Add Action" to attach

3. **Export Code**:
   - View generated HTML in bottom panel
   - Copy code for your own project

### Editor Mode

1. **Edit Code**:
   - Switch between HTML/CSS/JS tabs
   - Write your code in each editor
   - Changes auto-run after 1 second

2. **Preview**:
   - Right pane shows live preview
   - Click refresh button to force update
   - Click fullscreen for expanded view

3. **Controls**:
   - **▶ Run** - Force immediate preview update
   - **Clear** - Reset all editors (with confirmation)
   - **Format** - Basic code formatting
   - **Export** - Download as standalone HTML

### PAN Bus Monitor

Click "PAN Monitor" button in header to see real-time PAN bus messages:
- Message topic and payload
- Timestamp
- Source component
- Helps debug communication between components

## Architecture

### Mode Management

The `PlaygroundUnified` class manages all three modes:

```javascript
class PlaygroundUnified {
  constructor() {
    this.currentMode = 'gallery';  // gallery | builder | editor
    this.examples = getAllExamples();
    this.currentExample = null;
  }

  switchMode(mode) {
    // Update tabs, panels, and load appropriate content
  }
}
```

### Mode Switching Flow

```
Gallery Example Card
    ↓ "Open in Builder"
Builder Mode (loads example components)
    ↓ Edit properties, add styling
Builder Export
    ↓ Copy HTML
Editor Mode (paste and customize)
    ↓ Add JavaScript, refine CSS
Export Standalone HTML
```

### Component Communication

All modes use the existing PAN bus system:

```javascript
// Properties panel publishes changes
document.dispatchEvent(new CustomEvent('canvas-changed', {
  bubbles: true
}));

// Canvas listens for component selection
document.addEventListener('component-selected', (e) => {
  this.addComponent(e.detail);
});
```

## Key Improvements

### 1. Property Updates

**Old Behavior:**
- Properties sometimes didn't update
- No visual feedback
- Unclear when changes applied

**New Behavior:**
```javascript
attachPropertyListeners() {
  this.querySelectorAll('[data-attr]').forEach(input => {
    let eventType = input.type === 'checkbox' ? 'change' :
                   input.tagName === 'TEXTAREA' ? 'blur' : 'input';

    input.addEventListener(eventType, (e) => {
      const attrName = e.target.dataset.attr;
      const value = e.target.type === 'checkbox' ?
                   e.target.checked : e.target.value;

      // Update element immediately
      if (this.selectedElement) {
        if (value === '') {
          this.selectedElement.removeAttribute(attrName);
        } else {
          this.selectedElement.setAttribute(attrName, value);
        }
      }

      // Notify canvas
      document.dispatchEvent(new CustomEvent('canvas-changed'));
    });
  });
}
```

### 2. CSS Application

**Old Behavior:**
- CSS changes didn't visually apply
- Unclear if styles were saved

**New Behavior:**
```javascript
attachCSSListeners() {
  applyBtn.addEventListener('click', () => {
    const css = cssEditor.value;
    const componentId = this.selectedElement.dataset.componentId;

    // Store CSS
    this.customCSS.set(componentId, css);

    // Apply immediately via style attribute
    this.selectedElement.style.cssText = css;

    // Show success feedback
    this.showFeedback('Styles applied!', 'success');
  });
}
```

**Visual Feedback:**
Toast notifications appear when styles are applied/cleared.

### 3. Actions System

**Old Behavior:**
- Actions system partially implemented
- No clear indication of active actions

**New Behavior:**
```javascript
applyAction(action) {
  this.selectedElement.addEventListener(action.event, (e) => {
    switch (action.type) {
      case 'publish':
        // Publish to PAN bus
        document.dispatchEvent(new CustomEvent('pan:publish', {
          detail: {
            topic: action.topic,
            data: { source: this.componentMeta?.name }
          }
        }));
        break;

      case 'console':
        console.log(`[${this.componentMeta?.displayName}]`, action.message);
        break;

      case 'alert':
        alert(action.message);
        break;
    }
  });
}
```

Actions are immediately attached and work on next event trigger.

## Example: Using All Three Modes

### Scenario: Creating a Dashboard

1. **Start in Gallery**:
   - Find "Dashboard Layout" example
   - Click "Open in Builder"

2. **Customize in Builder**:
   - Example loads with pan-card, pan-table, pan-chart
   - Select pan-card
   - **Properties Tab**: Change header to "My Dashboard"
   - **CSS Tab**: Apply gradient preset
   - **Actions Tab**: Add click event that publishes to "card.clicked"

3. **Refine in Editor**:
   - Switch to Editor mode
   - Current state loads into HTML editor
   - Add JavaScript to handle "card.clicked" event:
     ```javascript
     document.addEventListener('pan:message', (e) => {
       if (e.detail.topic === 'card.clicked') {
         console.log('Card clicked!', e.detail);
       }
     });
     ```
   - Add custom CSS animations
   - Export as standalone HTML

4. **Test & Share**:
   - Open PAN Monitor to see messages
   - Test all interactions
   - Export final HTML
   - Deploy or share

## Best Practices

### Gallery Mode
- ✅ Use search to find examples quickly
- ✅ Preview examples before opening in Builder
- ✅ Check component list to understand what's included

### Builder Mode
- ✅ Always check the Properties tab to see available attributes
- ✅ Use CSS presets as starting points
- ✅ Test actions with PAN Monitor open
- ✅ Export code frequently to save progress

### Editor Mode
- ✅ Use HTML tab for structure
- ✅ Use CSS tab for styling
- ✅ Use JS tab for interactivity
- ✅ Wait 1 second after typing for auto-run
- ✅ Use "Format" button to clean up code
- ✅ Export when satisfied with result

## Troubleshooting

### Properties Not Updating

**Problem**: Changes in Properties tab don't reflect in component

**Solutions**:
1. For textareas (JSON/object fields): Click outside the textarea (blur event)
2. For text inputs: Type and wait for auto-update
3. For checkboxes/selects: Change fires immediately
4. Check browser console for errors

### CSS Not Applying

**Problem**: CSS in CSS tab doesn't show visual changes

**Solutions**:
1. Make sure to click "Apply Styles" button
2. Check CSS syntax (use presets as reference)
3. Verify component is still selected (blue outline)
4. Try clearing styles and reapplying

### Actions Not Firing

**Problem**: Event handlers don't trigger

**Solutions**:
1. Verify action was added (should appear in actions list)
2. Open PAN Monitor to see if messages are published
3. Check event type matches user interaction
4. Refresh page and re-add action if needed

### Editor Preview Not Updating

**Problem**: Code changes don't show in preview

**Solutions**:
1. Wait 1 second for debounced auto-run
2. Click "▶ Run" button to force update
3. Check for JavaScript errors in preview frame
4. Verify LARC components are loading (check network tab)

## Migration from Old Playground

If you want to keep both versions:

```bash
# Rename old playground
mv index.html index-classic.html

# Use new playground as default
cp index-new.html index.html

# Update links
# index-classic.html = old drag-and-drop only
# index.html = new unified system
```

## Technical Details

### Dependencies

- **@larcjs/core@3.0.1** - Core PAN bus system
- **@larcjs/ui@3.0.1** - UI components
- Existing pg-* components (palette, canvas, properties, etc.)

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requirements:
- ES Modules
- Custom Elements v1
- Shadow DOM
- CSS Grid
- Flexbox

### Performance

- Gallery mode: Renders 20+ cards efficiently
- Builder mode: Handles 50+ components on canvas
- Editor mode: 1-second debounce for auto-run
- All modes: Minimal memory footprint

## Future Enhancements

Potential improvements for future versions:

- [ ] Syntax highlighting in editor (CodeMirror/Monaco)
- [ ] Component search in Builder palette
- [ ] Undo/redo in Builder
- [ ] Save examples to localStorage
- [ ] Share examples via URL
- [ ] Import/export Builder projects
- [ ] Template library expansion
- [ ] Mobile-optimized layout
- [ ] Collaborative editing
- [ ] Video tutorials integration

## Support

For issues or questions:
- GitHub: https://github.com/larcjs/larc/issues
- Discord: https://discord.gg/zjUPsWTu
- Documentation: https://larcjs.com/docs/

## Contributing

The playground is open source! Contributions welcome:
1. Fork the repository
2. Make improvements
3. Test all three modes
4. Submit pull request

See CONTRIBUTING.md for guidelines.

---

**Built with LARC** - Lightweight Asynchronous Relay Core
