# LARC Playground - Quick Start

## Launch

**Server Running:** Yes (port 8080)
**URL:** http://localhost:8080/playground/

Just open the URL in your browser!

## 30-Second Test

1. **Component Palette** (left) - Click any component
2. **Canvas** (center) - See it appear
3. **Properties** (right) - Change an attribute
4. **View Code** (button) - See the HTML
5. **Copy** (button) - Copy to clipboard

That's it! The playground is working if all 5 steps succeed.

## Quick Feature Tour

### Add Components
- Browse 49 components in 10 categories
- Search: type "router", "store", "table", etc.
- Click any component to add to canvas

### Edit Properties
- Click a component on canvas to select it
- Properties panel shows on right
- Change any attribute - updates live!
- Click "Delete Component" to remove

### Generate Code
- Click "View Code" button
- See clean HTML for your design
- Click "Copy" to copy code
- Click "Download" to save file

### Monitor Messages
- Click "PAN Monitor" button
- See PAN bus messages in real-time
- Filter by topic
- Clear log when needed

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

## Learn More

- [TESTING.md](./TESTING.md) - Full testing checklist
- [PLAYGROUND-IMPLEMENTATION.md](../PLAYGROUND-IMPLEMENTATION.md) - Technical details
- [PLAYGROUND-STATUS.md](../PLAYGROUND-STATUS.md) - Current status

---

**Status:** 🟢 Ready to Test
**Build:** Complete
**Server:** Running

**Just open http://localhost:8080/playground/ and start clicking!**
