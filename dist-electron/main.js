import { app, dialog, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import xml2js from "xml2js";
import Parser from "rss-parser";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
const dbPath = path.join(app.getPath("userData"), "gather-rss.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      FOREIGN KEY(parent_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      site_url TEXT,
      icon_url TEXT,
      group_id INTEGER,
      updated_at DATETIME,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      author TEXT,
      published_at DATETIME,
      url TEXT NOT NULL UNIQUE,
      is_read BOOLEAN DEFAULT 0,
      is_saved BOOLEAN DEFAULT 0,
      is_downloaded BOOLEAN DEFAULT 0,
      FOREIGN KEY(feed_id) REFERENCES feeds(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
  console.log("Database initialized at:", dbPath);
}
async function importOpml(window2) {
  const { canceled, filePaths } = await dialog.showOpenDialog(window2, {
    properties: ["openFile"],
    filters: [{ name: "OPML Files", extensions: ["opml", "xml"] }]
  });
  if (canceled || filePaths.length === 0) {
    return { success: false, message: "Operation canceled" };
  }
  try {
    const content = fs.readFileSync(filePaths[0], "utf-8");
    const parser2 = new xml2js.Parser();
    const result = await parser2.parseStringPromise(content);
    const outlines = result.opml.body[0].outline;
    const processOutlines = (items, parentGroupId = null) => {
      for (const item of items) {
        const title = item.$.text || item.$.title || "Untitled";
        if (item.$.type === "rss" && item.$.xmlUrl) {
          try {
            const insert = db.prepare(`
              INSERT OR IGNORE INTO feeds (url, title, site_url, group_id)
              VALUES (@url, @title, @htmlUrl, @groupId)
            `);
            insert.run({
              url: item.$.xmlUrl,
              title,
              htmlUrl: item.$.htmlUrl || "",
              groupId: parentGroupId
            });
          } catch (e) {
            console.error("Failed to insert feed:", item.$.xmlUrl, e);
          }
        } else if (item.outline && item.outline.length > 0) {
          try {
            const insertGroup = db.prepare(`
              INSERT INTO groups (name, parent_id)
              VALUES (@name, @parentId)
            `);
            const info = insertGroup.run({
              name: title,
              parentId: parentGroupId
            });
            const newGroupId = info.lastInsertRowid;
            processOutlines(item.outline, newGroupId);
          } catch (e) {
            console.error("Failed to insert group:", title, e);
          }
        }
      }
    };
    if (outlines) {
      db.transaction(() => {
        processOutlines(outlines);
      })();
    }
    return { success: true, count: 0 };
  } catch (error) {
    console.error("OPML Import Error:", error);
    return { success: false, message: "Failed to parse OPML file" };
  }
}
const parser = new Parser();
const window = new JSDOM("").window;
const purify = DOMPurify(window);
async function addFeed(url, groupId = null) {
  try {
    const feed = await parser.parseURL(url);
    const title = feed.title || "Untitled Feed";
    const siteUrl = feed.link || "";
    const description = feed.description || "";
    const insert = db.prepare(`
      INSERT INTO feeds (url, title, description, site_url, group_id, updated_at)
      VALUES (@url, @title, @description, @siteUrl, @groupId, datetime('now'))
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        site_url = excluded.site_url,
        updated_at = datetime('now')
      RETURNING id
    `);
    const result = insert.get({
      url,
      title,
      description,
      siteUrl,
      groupId
    });
    console.log(`Feed added/updated: ${title} (${result.id})`);
    saveArticles(result.id, feed.items);
    return { success: true, feedId: result.id, title };
  } catch (error) {
    console.error("Add Feed Error:", error);
    return { success: false, message: "Failed to add feed: " + error.message };
  }
}
async function refreshAllFeeds() {
  const feeds = db.prepare("SELECT id, url FROM feeds").all();
  console.log(`Refreshing ${feeds.length} feeds...`);
  const results = await Promise.allSettled(feeds.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      saveArticles(feed.id, parsed.items);
      db.prepare('UPDATE feeds SET updated_at = datetime("now") WHERE id = ?').run(feed.id);
      return { id: feed.id, success: true };
    } catch (e) {
      console.error(`Failed to refresh feed ${feed.url}:`, e);
      return { id: feed.id, success: false };
    }
  }));
  return results;
}
function saveArticles(feedId, items) {
  const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO articles (feed_id, title, content, author, published_at, url)
    VALUES (@feedId, @title, @content, @author, @publishedAt, @url)
  `);
  const transaction = db.transaction((articles) => {
    for (const item of articles) {
      const cleanContent = purify.sanitize(item.content || item.contentSnippet || "");
      insertArticle.run({
        feedId,
        title: item.title || "No Title",
        content: cleanContent,
        author: item.creator || item.author || "",
        publishedAt: item.isoDate || (/* @__PURE__ */ new Date()).toISOString(),
        url: item.link || ""
      });
    }
  });
  transaction(items);
}
function getFeeds() {
  return db.prepare("SELECT * FROM feeds ORDER BY title ASC").all();
}
function getGroups() {
  return db.prepare("SELECT * FROM groups ORDER BY name ASC").all();
}
function getArticles(feedId, groupId, filter = "all") {
  let query = `
    SELECT a.id, a.feed_id, a.title, a.content, a.author, a.published_at, a.url, a.is_read, a.is_saved, f.title as feed_title, f.icon_url
    FROM articles a
    JOIN feeds f ON a.feed_id = f.id
  `;
  const conditions = [];
  const params = {};
  if (feedId) {
    conditions.push("a.feed_id = @feedId");
    params.feedId = feedId;
  }
  if (groupId) {
    conditions.push("f.group_id = @groupId");
    params.groupId = groupId;
  }
  if (filter === "unread") {
    conditions.push("a.is_read = 0");
  } else if (filter === "saved") {
    conditions.push("a.is_saved = 1");
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY a.published_at DESC LIMIT 100";
  return db.prepare(query).all(params);
}
function getArticleContent(articleId) {
  return db.prepare("SELECT content FROM articles WHERE id = ?").get(articleId);
}
function markArticleRead(articleId, isRead = true) {
  db.prepare("UPDATE articles SET is_read = ? WHERE id = ?").run(isRead ? 1 : 0, articleId);
}
function markArticleSaved(articleId, isSaved = true) {
  db.prepare("UPDATE articles SET is_saved = ? WHERE id = ?").run(isSaved ? 1 : 0, articleId);
}
function deleteFeed(feedId) {
  db.prepare("DELETE FROM feeds WHERE id = ?").run(feedId);
}
function createGroup(name) {
  const insert = db.prepare("INSERT INTO groups (name) VALUES (?) RETURNING *");
  return insert.get(name);
}
function renameGroup(id, name) {
  db.prepare("UPDATE groups SET name = ? WHERE id = ?").run(name, id);
}
function deleteGroup(id) {
  const transaction = db.transaction(() => {
    db.prepare("UPDATE feeds SET group_id = NULL WHERE group_id = ?").run(id);
    db.prepare("DELETE FROM groups WHERE id = ?").run(id);
  });
  transaction();
}
function moveFeedToGroup(feedId, groupId) {
  db.prepare("UPDATE feeds SET group_id = ? WHERE id = ?").run(groupId, feedId);
}
const feedService = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addFeed,
  createGroup,
  deleteFeed,
  deleteGroup,
  getArticleContent,
  getArticles,
  getFeeds,
  getGroups,
  markArticleRead,
  markArticleSaved,
  moveFeedToGroup,
  refreshAllFeeds,
  renameGroup
}, Symbol.toStringTag, { value: "Module" }));
const __dirname$1 = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  initDb();
  createWindow();
  ipcMain.handle("get-app-version", () => app.getVersion());
  ipcMain.handle("opml-import", async () => {
    if (!win) return { success: false, message: "Window not found" };
    return await importOpml(win);
  });
  ipcMain.handle("add-feed", async (_event, url) => {
    return await addFeed(url);
  });
  ipcMain.handle("refresh-feeds", async () => {
    return await refreshAllFeeds();
  });
  ipcMain.handle("get-feeds", () => getFeeds());
  ipcMain.handle("get-groups", () => getGroups());
  ipcMain.handle("get-articles", (_e, { feedId, groupId, filter, searchQuery }) => getArticles(feedId, groupId, filter));
  ipcMain.handle("get-article-content", (_e, id) => getArticleContent(id));
  ipcMain.handle("mark-read", (_e, { id, isRead }) => markArticleRead(id, isRead));
  ipcMain.handle("mark-saved", (_e, { id, isSaved }) => markArticleSaved(id, isSaved));
  ipcMain.handle("delete-feed", (_e, id) => deleteFeed(id));
  ipcMain.handle("create-group", (_e, name) => Promise.resolve().then(() => feedService).then((m) => m.createGroup(name)));
  ipcMain.handle("rename-group", (_e, { id, name }) => Promise.resolve().then(() => feedService).then((m) => m.renameGroup(id, name)));
  ipcMain.handle("delete-group", (_e, id) => Promise.resolve().then(() => feedService).then((m) => m.deleteGroup(id)));
  ipcMain.handle("move-feed-to-group", (_e, { feedId, groupId }) => Promise.resolve().then(() => feedService).then((m) => m.moveFeedToGroup(feedId, groupId)));
  setInterval(() => {
    console.log("Background polling...");
    refreshAllFeeds();
  }, 15 * 60 * 1e3);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
