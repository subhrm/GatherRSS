# Product Requirement Document: "GatherRSS" Desktop RSS Reader

## 1. Project Overview

**Goal:** Develop a cross-platform desktop RSS reader using React and Electron. The application must prioritize a polished, minimalist aesthetic ("clean and modern") UX with high usability. It serves as a central hub for the user to organize, consume, and share content from various web RSS feeds efficiently.

**Target Platforms:** macOS, Windows, Linux (via Electron).

## 2. Technical Stack

* **Core Framework:** Electron (main process management).
* **UI Library:** React.js.
* **Styling:** Tailwind CSS (to ensure the "polished/clean" requirement).
* **State Management:** React Context API
* **Local Database:** SQLite

---

## 3. Functional Requirements

### 3.1 Feed & Group Management

* **Add Feeds:** Users can add a feed via URL. The system should auto-discover the RSS/Atom link if the user provides a generic website URL.
* **Nested Grouping (Folders):** Users can create folders and sub-folders (infinite or fixed depth) to organize feeds (e.g., Tech > Web Dev > React).
* **Feed Management:** Options to rename, unsubscribe, or move feeds between groups via drag-and-drop.
* **Share Feeds:** Ability to export a specific folder or list of feeds as a shareable link or file for other users of the app.

### 3.2 Content Consumption & Offline Mode

* **Offline First Architecture:** All fetched articles must be stored locally. The app should remain fully functional (reading saved content) without an internet connection.
* **Article Rendering:**
* **Sanitized View:** Strip ads and clutter; render text and essential images cleanly.
* **Web View:** Option to open the original URL in an internal browser or default external browser.


* **Save for Later:** A dedicated "Saved Items" or "Bookmarks" section for articles the user wants to keep indefinitely.
* **Export to PDF:** Native print-to-PDF functionality for individual articles, preserving readability.

### 3.3 Background Services & Notifications

* **Periodic Fetching:** Configurable background intervals (e.g., every 15 min, 1 hour) to check for new content.
* **Smart Notifications:** System-level notifications for new articles.
* *Constraint:* Must include "Quiet Hours" or specific granular settings (e.g., "Notify me only for the 'Urgent' folder") to avoid alert fatigue.



### 3.4 Sharing & Social

* **Social Sharing:** Integrated buttons to share article links to Twitter/X, LinkedIn, Email, or copy to clipboard.
* **Internal Sharing:** Ability to bundle a specific article with user notes and send it to another user of the app (if backend sync is implemented) or via email.


### 3.5 OPML Import/Export (Crucial)

* **Requirement:** Users typically migrate from other readers (Feedly, Reeder). The app **must** support importing and exporting `.opml` files. Without this, user adoption will be near zero.

### 3.6 "Readability" Mode & Typography Controls

* **Requirement:** Since the goal is a "clean" reading experience, users must control font size, font family (Serif vs. Sans), and line height.
* **Parser:** Integrate a library like Mozilla's Readability.js to extract article content effectively from messy websites.

### 3.7 Full-Text Search

* **Requirement:** Index local articles to allow users to search for keywords across all their downloaded feeds.

### 3.8 Dark/Light Mode & Theming

* **Requirement:** Auto-detect system theme (Dark/Light) and allow manual overrides. This is standard for modern desktop apps.

### 3.9 Keyboard Shortcuts (Accessibility & Power Users)

* **Requirement:** `j` / `k` navigation to move between articles, `m` to mark as read, `s` to save. Desktop users expect keyboard efficiency.

### 3.10 Read vs. Unread State

* **Requirement:** Visual indicators for unread items. Options to "Mark All as Read" for a specific folder or globally.

---

## 4. UI/UX Guidelines

* **Layout:** Three-pane layout (Sidebar: Feeds | Middle: Article List | Right: Content View) or Two-pane with collapsible sidebar.
* **Performance:** The app must feel "native." Avoid the typical Electron lag by using virtualized lists (e.g., `react-window`) for feed lists that contain thousands of items.
* **Empty States:** Beautiful, illustrative empty states when a user has no feeds or no new articles.


