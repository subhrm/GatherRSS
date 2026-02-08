import { dialog } from 'electron';
import fs from 'fs';
import xml2js from 'xml2js';
import db from './db';

interface OpmlOutline {
    $: {
        text: string;
        title?: string;
        type?: string;
        xmlUrl?: string;
        htmlUrl?: string;
    };
    outline?: OpmlOutline[];
}

interface OpmlResult {
    opml: {
        body: [
            {
                outline: OpmlOutline[];
            }
        ];
    };
}

export async function importOpml(window: Electron.BrowserWindow) {
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
        properties: ['openFile'],
        filters: [{ name: 'OPML Files', extensions: ['opml', 'xml'] }],
    });

    if (canceled || filePaths.length === 0) {
        return { success: false, message: 'Operation canceled' };
    }

    try {
        const content = fs.readFileSync(filePaths[0], 'utf-8');
        const parser = new xml2js.Parser();
        const result: OpmlResult = await parser.parseStringPromise(content);

        const outlines = result.opml.body[0].outline;

        // Recursive function to process outlines and save to DB
        const processOutlines = (items: OpmlOutline[], parentGroupId: number | null = null) => {
            for (const item of items) {
                const title = item.$.text || item.$.title || 'Untitled';

                if (item.$.type === 'rss' && item.$.xmlUrl) {
                    // It's a feed
                    try {
                        const insert = db.prepare(`
              INSERT OR IGNORE INTO feeds (url, title, site_url, group_id)
              VALUES (@url, @title, @htmlUrl, @groupId)
            `);
                        insert.run({
                            url: item.$.xmlUrl,
                            title: title,
                            htmlUrl: item.$.htmlUrl || '',
                            groupId: parentGroupId
                        });
                    } catch (e) {
                        console.error('Failed to insert feed:', item.$.xmlUrl, e);
                    }
                } else if (item.outline && item.outline.length > 0) {
                    // It's a group (folder)
                    try {
                        const insertGroup = db.prepare(`
              INSERT INTO groups (name, parent_id)
              VALUES (@name, @parentId)
            `);
                        const info = insertGroup.run({
                            name: title,
                            parentId: parentGroupId
                        });
                        const newGroupId = info.lastInsertRowid as number;
                        processOutlines(item.outline, newGroupId);
                    } catch (e) {
                        console.error('Failed to insert group:', title, e);
                    }
                }
            }
        };

        if (outlines) {
            db.transaction(() => {
                processOutlines(outlines);
            })();
        }

        return { success: true, count: 0 }; // TODO: Return actual count
    } catch (error) {
        console.error('OPML Import Error:', error);
        return { success: false, message: 'Failed to parse OPML file' };
    }
}

export async function exportOpml() {
    // TODO: Implement export logic
    return { success: false, message: 'Not implemented' };
}
