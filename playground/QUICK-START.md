# LARC Playground - Quick Start

## Launch

**Server Running:** Yes (port 8080)
**URL:** http://localhost:8080/playground/

Just open the URL in your browser!

## 30-Second Test

1. **Component Palette** (left) - Click any component
2. **Canvas** (center) - See it appear with a badge
3. **Properties** (right) - Change an attribute
4. **View Code** (button) - See the HTML
5. **Edit** (button) - Edit code directly
6. **Apply** (button) - Sync code back to visual

That's it! The playground is working if all 6 steps succeed.

## Quick Feature Tour

### 🆕 What's New in This Version
- **Live Markup Editor**: Edit HTML directly with syntax validation
- **Bidirectional Sync**: Changes flow visual ↔ code seamlessly
- **Better Component Rendering**: Components look more realistic
- **Visual Badges**: Floating badges show component names
- **21 Pre-built Examples**: Load and learn from curated examples
- **Improved UX**: Smoother animations and better visual feedback

### Add Components
- Browse 49 components in 10 categories
- Search: type "router", "store", "table", etc.
- Click any component to add to canvas
- Components appear with floating badges

### Edit Properties
- Click a component on canvas to select it
- Properties panel shows on right
- Change any attribute - updates live!
- Click "Delete Component" to remove

### Generate & Edit Code ✨ NEW!
- Click "View Code" button
- See clean HTML with syntax highlighting
- Click "✏️ Edit" to enter edit mode
- Modify markup directly in the editor
- Click "✓ Apply" to sync changes to canvas
- Click "Copy" to copy code
- Click "Download" to save file

**Bidirectional Sync:** Edit visually OR in code - changes sync both ways!

### Monitor Messages
- Click "PAN Monitor" button
- See PAN bus messages in real-time
- Filter by topic
- Clear log when needed

### Load Examples ✨ NEW!
- 21 pre-built examples in the header dropdown
- Examples include: Router, Forms, Tables, Auth, Real-time, etc.
- Click "Load Example..." and select one
- Perfect for learning and starting projects

### Responsive Views
- Dropdown: Desktop / Tablet / Mobile
- Watch canvas resize
- Test responsive components

## Component Categories

- 🧭 **Routing:** pan-router, pan-link
- 💾 **State:** pan-store, pan-idb
- 📝 **Forms:** pan-form, pan-dropdown, pan-date-picker
- 🔌 **Data:** pan-fetch, pan-websocket, pan-graphql-connector
- 🎨 **UI:** pan-card, pan-modal, pan-tabs, pan-table
- 📄 **Content:** pan-markdown-editor, pan-files
- 🔐 **Auth:** pan-jwt, pan-auth, pan-security
- 🎭 **Theme:** pan-theme-provider, pan-theme-toggle
- 🔧 **DevTools:** pan-inspector, pan-forwarder
- ⚙️ **Advanced:** pan-worker, pan-schema

## Keyboard Tips

- **Click** component = Select
- **Click** background = Deselect
- **Search** box = Filter components
- **Enter** in search = First result
- **Tab** in code editor = Insert spaces
- **Ctrl/Cmd + A** in code editor = Select all

## Troubleshooting

### Nothing Loads
- Check console for errors (F12)
- Verify server running on port 8080
- Check URL is http://localhost:8080/playground/

### Component Won't Add
- May not be implemented yet
- Check console for import errors
- Try a different component

### Properties Not Showing
- Click component again to select
- Some components have no attributes
- Check properties panel on right

### Code Export Empty
- Add components to canvas first
- Components must be on canvas to export

### Code Changes Not Applying ✨ NEW!
- Check status message for errors
- Ensure HTML is well-formed (no unclosed tags)
- Look for parser errors in red status bar
- Try "View" mode first to see current code

### Component Badges Not Showing
- Badges appear on hover and selection
- Check if component is properly added
- Try clicking component to select it

## What's Next?

After testing:
1. Report any bugs you find
2. Try different component combinations
3. Test in different browsers
4. Deploy to GitHub Pages

## Files

- `index.html` - Main page
- `playground.mjs` - Entry point
- `component-registry.json` - Component metadata
- `components/` - Playground components (5)
- `styles/playground.css` - All styling

## Architecture

- **Zero Build:** No compilation needed
- **ES Modules:** Native browser imports
- **Web Components:** Custom elements
- **PAN Bus:** Message-based communication
- **Bidirectional Sync:** Visual ↔ Code in real-time
- **Live Editing:** Edit mode with instant feedback
- **Syntax Highlighting:** GitHub-style code display

## Learn More

- [TESTING.md](./TESTING.md) - Full testing checklist
- [PLAYGROUND-IMPLEMENTATION.md](../PLAYGROUND-IMPLEMENTATION.md) - Technical details
- [PLAYGROUND-STATUS.md](../PLAYGROUND-STATUS.md) - Current status

---

**Status:** 🟢 Ready to Test
**Build:** Complete
**Server:** Running

**Just open http://localhost:8080/playground/ and start clicking!**
