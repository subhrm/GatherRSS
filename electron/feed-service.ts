import Parser from 'rss-parser';
import db from './db';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const parser = new Parser();
const window = new JSDOM('').window;
const purify = DOMPurify(window);

export async function addFeed(url: string, groupId: number | null = null) {
    try {
        const feed = await parser.parseURL(url);
        const title = feed.title || 'Untitled Feed';
        const siteUrl = feed.link || '';
        const description = feed.description || '';

        // Insert feed
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
        }) as { id: number };

        console.log(`Feed added/updated: ${title} (${result.id})`);

        // Save initial articles
        saveArticles(result.id, feed.items);

        return { success: true, feedId: result.id, title };
    } catch (error) {
        console.error('Add Feed Error:', error);
        return { success: false, message: 'Failed to add feed: ' + (error as Error).message };
    }
}

export async function refreshAllFeeds() {
    const feeds = db.prepare('SELECT id, url FROM feeds').all() as { id: number, url: string }[];
    console.log(`Refreshing ${feeds.length} feeds...`);

    const results = await Promise.allSettled(feeds.map(async (feed) => {
        try {
            const parsed = await parser.parseURL(feed.url);
            saveArticles(feed.id, parsed.items);

            // Update feed updated_at
            db.prepare('UPDATE feeds SET updated_at = datetime("now") WHERE id = ?').run(feed.id);
            return { id: feed.id, success: true };
        } catch (e) {
            console.error(`Failed to refresh feed ${feed.url}:`, e);
            return { id: feed.id, success: false };
        }
    }));

    return results;
}

function saveArticles(feedId: number, items: Parser.Item[]) {
    const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO articles (feed_id, title, content, author, published_at, url)
    VALUES (@feedId, @title, @content, @author, @publishedAt, @url)
  `);

    const transaction = db.transaction((articles: Parser.Item[]) => {
        for (const item of articles) {
            // Basic sanitization
            const cleanContent = purify.sanitize(item.content || item.contentSnippet || '');

            insertArticle.run({
                feedId,
                title: item.title || 'No Title',
                content: cleanContent,
                author: item.creator || (item as any).author || '',
                publishedAt: item.isoDate || new Date().toISOString(),
                url: item.link || ''
            });
        }
    });

    transaction(items);
}

// --- Read Operations ---

export function getFeeds() {
    return db.prepare('SELECT * FROM feeds ORDER BY title ASC').all();
}

export function getGroups() {
    return db.prepare('SELECT * FROM groups ORDER BY name ASC').all();
}

export function getArticles(feedId?: number, groupId?: number, filter: 'all' | 'unread' | 'saved' = 'all') {
    let query = `
    SELECT a.id, a.feed_id, a.title, a.author, a.published_at, a.url, a.is_read, a.is_saved, f.title as feed_title, f.icon_url
    FROM articles a
    JOIN feeds f ON a.feed_id = f.id
  `;

    const conditions = [];
    const params: any = {};

    if (feedId) {
        conditions.push('a.feed_id = @feedId');
        params.feedId = feedId;
    }

    if (groupId) {
        // This is simple depth-1 group check. For recursive, we need CTEs, but keeping it simple for now or usage in React.
        // If groupId is provided, we might want to filtered by feeds in that group.
        // Let's assume the frontend passes feedId usually. If groupId is passed, we filter by feeds in that group.
        conditions.push('f.group_id = @groupId');
        params.groupId = groupId;
    }

    if (filter === 'unread') {
        conditions.push('a.is_read = 0');
    } else if (filter === 'saved') {
        conditions.push('a.is_saved = 1');
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.published_at DESC LIMIT 100'; // Pagination TODO

    return db.prepare(query).all(params);
}

export function getArticleContent(articleId: number) {
    return db.prepare('SELECT content FROM articles WHERE id = ?').get(articleId);
}

// --- Write Operations ---

export function markArticleRead(articleId: number, isRead: boolean = true) {
    db.prepare('UPDATE articles SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, articleId);
}

export function markArticleSaved(articleId: number, isSaved: boolean = true) {
    db.prepare('UPDATE articles SET is_saved = ? WHERE id = ?').run(isSaved ? 1 : 0, articleId);
}

export function deleteFeed(feedId: number) {
    db.prepare('DELETE FROM feeds WHERE id = ?').run(feedId);
}
