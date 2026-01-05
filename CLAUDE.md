# LARC Project Instructions

## File Permissions

When creating new files and directories, always set proper permissions:

- **New files:** `chmod 644` (rw-r--r--)
- **New directories:** `chmod 755` (rwxr-xr-x)

This ensures files are readable by the web server but not executable.

## Project Structure

- `/packages/core/` - Core PAN bus and client
- `/packages/ui/` - UI components (connectors, tables, forms, etc.)
- `/apps/` - Showcase applications
- `/examples/tutorials/` - Demo pages and tutorials
- `/devtools/` - Browser extension for PAN debugging

## Component Conventions

- Components use PAN message bus for communication
- Use `PanClient` from `pan-client.mjs` for pub/sub
- Resource topics follow pattern: `${resource}.list.state`, `${resource}.item.get`, etc.
- Retained messages for state, non-retained for events

## Commit Messages

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
- No "Co-authored by Claude" attribution
