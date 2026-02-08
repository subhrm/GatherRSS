# GatherRSS Reader

A modern, clean, and distraction-free desktop RSS reader built with productivity in mind.

![GatherRSS Screenshot](./screenshot.png) <!-- Ideally this would be a real image -->

## ✨ Features

- **Modern Interface**: Clean three-pane layout with a premium dark theme.
- **Feed Management**: Add RSS/Atom feeds, organize into groups, and import/export via OPML.
- **Reading Experience**: Distraction-free reader view with sanitized content and beautiful typography.
- **Productivity**: 
  - **Lightning-fast Search**: Instant search across titles and content.
  - **Keyboard Shortcuts**: Navigate articles (`j`/`k`), mark read (`m`), and favorite (`s`).
  - **Smart Filters**: Quickly access Unread, Saved, or All articles.
- **Offline First**: Articles are stored locally in a SQLite database for offline access.
- **Customizable**: Toggle between Light/Dark modes and manage sync intervals.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gather-rss.git
   cd gather-rss
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```
   The installer will be generated in `release/`.

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS (v4)
- **Backend**: Electron (Main Process), SQLite (`better-sqlite3`)
- **Build Tooling**: Vite, Electron Builder

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `j` / `↓` | Next Article |
| `k` / `↑` | Previous Article |
| `m` | Toggle Read/Unread |
| `s` | Toggle Saved (Star) |
| `Cmd/Ctrl + r` | Refresh Feeds |

## 📄 License

MIT
