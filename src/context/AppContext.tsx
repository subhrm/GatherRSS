import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Types (should match Backend)
export interface Group {
    id: number;
    name: string;
    parent_id: number | null;
}

export interface Feed {
    id: number;
    url: string;
    title: string;
    description?: string;
    site_url?: string;
    icon_url?: string;
    group_id: number | null;
    updated_at?: string;
}

export interface Article {
    id: number;
    feed_id: number;
    title: string;
    content?: string;
    author?: string;
    published_at?: string;
    url: string;
    is_read: number; // SQLite boolean
    is_saved: number;
    feed_title: string;
    icon_url?: string;
}

interface AppContextType {
    feeds: Feed[];
    groups: Group[];
    articles: Article[];
    selectedFeedId: number | null;
    selectedGroupId: number | null;
    selectedFilter: 'all' | 'unread' | 'saved';
    selectedArticleId: number | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    isLoading: boolean;
    refreshFeeds: () => Promise<void>;
    addFeed: (url: string) => Promise<{ success: boolean; message?: string }>;
    selectFeed: (feedId: number | null) => void;
    selectGroup: (groupId: number | null) => void;
    selectFilter: (filter: 'all' | 'unread' | 'saved') => void;
    selectArticle: (articleId: number | null) => void;
    markArticleRead: (id: number, isRead: boolean) => void;
    markArticleSaved: (id: number, isSaved: boolean) => void;
    importOpml: () => Promise<void>;
    createGroup: (name: string) => Promise<void>;
    renameGroup: (id: number, name: string) => Promise<void>;
    deleteGroup: (id: number) => Promise<void>;
    moveFeedToGroup: (feedId: number, groupId: number | null) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'saved'>('all');
    const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const loadedFeeds = await window.ipcRenderer.invoke('get-feeds');
            const loadedGroups = await window.ipcRenderer.invoke('get-groups');
            setFeeds(loadedFeeds);
            setGroups(loadedGroups);
        } catch (error) {
            console.error('Failed to load feeds/groups', error);
        }
    }, []);

    const loadArticles = useCallback(async () => {
        setIsLoading(true);
        try {
            const loadedArticles = await window.ipcRenderer.invoke('get-articles', {
                feedId: selectedFeedId,
                groupId: selectedGroupId,
                filter: selectedFilter,
                searchQuery
            });
            setArticles(loadedArticles);
        } catch (error) {
            console.error('Failed to load articles', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFeedId, selectedGroupId, selectedFilter, searchQuery]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        loadArticles();
        setSelectedArticleId(null);
    }, [loadArticles]);

    const refreshFeeds = async () => {
        setIsLoading(true);
        await window.ipcRenderer.invoke('refresh-feeds');
        await loadData();
        await loadArticles();
        setIsLoading(false);
    };

    const addFeed = async (url: string) => {
        const result = await window.ipcRenderer.invoke('add-feed', url);
        if (result.success) {
            loadData();
        }
        return result;
    };

    const importOpml = async () => {
        const result = await window.ipcRenderer.invoke('opml-import');
        if (result.success) {
            loadData();
        }
    };

    const markArticleRead = async (id: number, isRead: boolean) => {
        // Optimistic update
        setArticles(prev => prev.map(a => a.id === id ? { ...a, is_read: isRead ? 1 : 0 } : a));
        await window.ipcRenderer.invoke('mark-read', { id, isRead });
    };

    const markArticleSaved = async (id: number, isSaved: boolean) => {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, is_saved: isSaved ? 1 : 0 } : a));
        await window.ipcRenderer.invoke('mark-saved', { id, isSaved });
    };

    const createGroup = async (name: string) => {
        await window.ipcRenderer.invoke('create-group', name);
        await loadData();
    };

    const renameGroup = async (id: number, name: string) => {
        await window.ipcRenderer.invoke('rename-group', { id, name });
        await loadData();
    };

    const deleteGroup = async (id: number) => {
        await window.ipcRenderer.invoke('delete-group', id);
        await loadData();
    };

    const moveFeedToGroup = async (feedId: number, groupId: number | null) => {
        await window.ipcRenderer.invoke('move-feed-to-group', { feedId, groupId });
        await loadData();
        // Also update local state optimistically if needed, but loadData is fast enough for now
    };

    const value = {
        feeds,
        groups,
        articles,
        selectedFeedId,
        selectedGroupId,
        selectedFilter,
        selectedArticleId,
        searchQuery,
        setSearchQuery,
        showSettings,
        setShowSettings,
        isLoading,
        refreshFeeds,
        addFeed,
        selectFeed: (id: number | null) => { setSelectedFeedId(id); setSelectedGroupId(null); },
        selectGroup: (id: number | null) => { setSelectedGroupId(id); setSelectedFeedId(null); },
        selectFilter: setSelectedFilter,
        selectArticle: setSelectedArticleId,
        markArticleRead,
        markArticleSaved,
        importOpml,
        createGroup,
        renameGroup,
        deleteGroup,
        moveFeedToGroup
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
