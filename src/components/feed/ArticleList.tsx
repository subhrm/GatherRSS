import { Article, useApp } from '../../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { Star, Circle, Clock } from 'lucide-react';
import { CSSProperties } from 'react';

interface ArticleListProps {
    onSelectArticle: (article: Article) => void;
    selectedArticleId: number | null;
}

export function ArticleList({ onSelectArticle, selectedArticleId }: ArticleListProps) {
    const { articles } = useApp();

    const Row = ({ index, style }: { index: number; style?: CSSProperties }) => {
        const article = articles[index];
        const isSelected = article.id === selectedArticleId;

        return (
            <div
                style={style}
                onClick={() => onSelectArticle(article)}
                className={`
                    group relative p-4 cursor-pointer transition-all duration-200 border-b border-[#1f1f1f]
                    ${isSelected
                        ? 'bg-[#1a1a1a] shadow-[inset_3px_0_0_0_#3b82f6]'
                        : 'bg-[#111111] hover:bg-[#161616]'}
                    ${article.is_read ? 'opacity-70' : 'opacity-100'}
                `}
            >
                {/* Meta Row */}
                <div className="flex justify-between items-center mb-1.5 min-w-0 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {/* Feed Icon/Dot */}
                        {!article.is_read && (
                            <Circle size={6} className="fill-blue-500 text-blue-500 shrink-0" />
                        )}
                        <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                            {article.feed_title}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0 whitespace-nowrap flex items-center gap-1">
                        {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ''}
                    </span>
                </div>

                {/* Title */}
                <h3 className={`text-sm font-semibold leading-snug mb-2 line-clamp-2 ${isSelected ? 'text-gray-100' : 'text-gray-300 group-hover:text-gray-100'}`}>
                    {article.title}
                </h3>

                {/* Footer / Snippet (Future) */}
                <div className="flex justify-between items-center h-4">
                    <div className="text-[11px] text-gray-600 truncate flex-1 pr-2">
                        {article.author ? `by ${article.author}` : ''}
                    </div>

                    <div className="flex items-center gap-2">
                        {article.is_saved && <Star size={12} className="fill-amber-500 text-amber-500" />}
                    </div>
                </div>
            </div>
        );
    };

    if (articles.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-[#111111]">
                <div className="mb-2 p-3 bg-[#1a1a1a] rounded-full">
                    <Inbox size={24} className="opacity-50" />
                </div>
                <p className="text-sm">No articles found</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#111111] custom-scrollbar overflow-y-auto">
            {articles.map((_, index) => (
                <Row key={articles[index].id} index={index} />
            ))}
        </div>
    );
}

// Helper for empty state icon
import { Inbox } from 'lucide-react';
