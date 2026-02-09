# AGENTS.md - GatherRSS Reader

## 📋 Project Overview

**GatherRSS** is a modern, cross-platform desktop RSS reader built with Electron and React. 

### Key Features
- **Modern Three-Pane Layout**: Sidebar for feeds/groups, article list, and content viewer
- **Feed Management**: Add, organize, sync, and delete RSS/Atom feeds
- **Group/Folder Organization**: Hierarchical organization of feeds into groups
- **Offline-First Architecture**: All articles stored locally in SQLite
- **OPML Import/Export**: Standard feed list import/export
- **Search**: Full-text search across article titles and content
- **Reading Experience**: Clean, sanitized article view with typography controls
- **Keyboard Shortcuts**: `j`/`k` navigation, `m` mark read, `s` save/star
- **Dark Mode**: Premium dark theme with Tailwind CSS

## 🏗️ Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS v4 with custom configuration
- **State Management**: React Context API (`AppContext`)
- **UI Components**: 
  - `lucide-react` for icons
  - `react-window` for virtualized lists
  - `react-virtualized-auto-sizer` for responsive layouts
- **Build Tool**: Vite

### Backend (Electron Main Process)
- **Runtime**: Electron
- **Database**: SQLite via `better-sqlite3` (with WAL mode enabled)
- **RSS Parsing**: `rss-parser` library
- **Content Sanitization**: DOMPurify with JSDOM
- **IPC**: Electron's `ipcMain`/`ipcRenderer` for communication

## 🗄️ Database Schema

The SQLite database (`gather-rss.db`) is stored in the user's application data directory.

### Tables

- `groups`: Hierarchical feed organization.
- `feeds`: RSS/Atom feed subscriptions.
- `articles`: Downloaded articles from feeds.
- `settings`: Application settings (key-value pairs).

##  IPC Communication:
The application uses Electron's IPC for communication between the main process (backend) and renderer process (frontend).

### Frontend Usage
The frontend accesses IPC through `window.ipcRenderer.invoke()`:

## 🎨 Frontend Architecture

- State Management: The application uses **React Context API** for global state management. The primary context is `AppContext` (in `src/context/AppContext.tsx`).

- Keyboard Shortcuts : Implemented in `src/hooks/useKeyboardShortcuts.ts`:

## 🔧 Backend Architecture

- Feed Service (`electron/feed-service.ts`)

- The core RSS management logic.

### Database Initialization (`electron/db.ts`)

- Creates SQLite database in `app.getPath('userData')/gather-rss.db`
- Enables WAL mode for better concurrency
- Initializes schema on first run
- Exports singleton `db` instance

### OPML Support (`electron/opml.ts`)

- Import: Parses OPML XML, creates groups, adds feeds
- Export: Generates OPML from current feed list

### Main Process (`electron/main.ts`)

- Creates BrowserWindow
- Registers IPC handlers
- Initializes database
- Sets up background polling (15-minute interval)

### Development Mode
- run `npm run dev`
- Opens Electron window with hot-reload
- React DevTools available
- Check Console in Electron DevTools for errors

### Debugging Tips

1. **Frontend issues**: Open DevTools in Electron window (`Cmd+Option+I` / `Ctrl+Shift+I`)
2. **Backend issues**: Check terminal logs where `npm run dev` is running
3. **Database queries**: Add `console.log()` in `feed-service.ts`
4. **IPC issues**: Log on both sides (renderer and main process)

## 📐 Design Patterns

### Offline-First Architecture
- All articles stored locally in SQLite
- Background sync every 15 minutes
- Works fully offline after initial sync

### Optimistic UI Updates
- Mark read/saved updates UI immediately
- IPC call runs in background
- Improves perceived performance

### Virtualized Lists
- `react-window` for article list
- Renders only visible items
- Handles thousands of articles smoothly

### Content Sanitization
- DOMPurify removes malicious/unwanted HTML
- Prevents XSS attacks
- Strips ads and clutter

### Hierarchical Groups
- Self-referential `parent_id` in `groups` table
- Currently supports depth-1 (can be extended)
- Cascade deletes maintain referential integrity

## ✅ Best Practices for AI Agents

When working on this codebase:

1. **Always check both frontend and backend** when adding features
2. **Use TypeScript strictly** - maintain type safety
3. **Update IPC handlers** when adding backend functionality
4. **Test with `npm run dev`** before committing
5. **Sanitize user input** - especially feed URLs and HTML content
6. **Use transactions** for batch database operations
7. **Follow existing patterns** - observe how similar features are implemented
8. **Keep components focused** - separate concerns (layout, logic, presentation)
9. **Use Tailwind utilities** - avoid custom CSS unless necessary
10. **Handle errors gracefully** - especially for network operations and parsing
