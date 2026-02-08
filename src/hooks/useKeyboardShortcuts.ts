import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useKeyboardShortcuts() {
    const {
        articles,
        selectedArticleId,
        selectArticle,
        markArticleRead,
        markArticleSaved,
        refreshFeeds
    } = useApp();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case 'j':
                case 'ArrowDown':
                    e.preventDefault();
                    selectNextArticle();
                    break;
                case 'k':
                case 'ArrowUp':
                    e.preventDefault();
                    selectPrevArticle();
                    break;
                case 'm':
                    if (selectedArticleId) {
                        const article = articles.find(a => a.id === selectedArticleId);
                        if (article) markArticleRead(article.id, !article.is_read);
                    }
                    break;
                case 's':
                    if (selectedArticleId) {
                        const article = articles.find(a => a.id === selectedArticleId);
                        if (article) markArticleSaved(article.id, !article.is_saved);
                    }
                    break;
                case 'r':
                    // Refresh (maybe with modifier?)
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        refreshFeeds();
                    }
                    break;
            }
        };

        const selectNextArticle = () => {
            if (!articles.length) return;
            const currentIndex = articles.findIndex(a => a.id === selectedArticleId);
            if (currentIndex === -1) {
                selectAndRead(articles[0].id);
            } else if (currentIndex < articles.length - 1) {
                selectAndRead(articles[currentIndex + 1].id);
            }
        };

        const selectPrevArticle = () => {
            if (!articles.length) return;
            const currentIndex = articles.findIndex(a => a.id === selectedArticleId);
            if (currentIndex === -1) {
                selectAndRead(articles[articles.length - 1].id);
            } else if (currentIndex > 0) {
                selectAndRead(articles[currentIndex - 1].id);
            }
        };

        const selectAndRead = (id: number) => {
            selectArticle(id);
            markArticleRead(id, true);
            // TODO: Scroll to item logic if not virtualized auto-scroll
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [articles, selectedArticleId, selectArticle, markArticleRead, markArticleSaved, refreshFeeds]);
}
