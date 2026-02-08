// import React from 'react';
import { Article, useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { ExternalLink, Star, Check, Calendar, User } from 'lucide-react';
import DOMPurify from 'dompurify';

interface ArticleViewProps {
    article: Article | null;
}

export function ArticleView({ article }: ArticleViewProps) {
    const { markArticleSaved, markArticleRead } = useApp();

    if (!article) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-[#0a0a0a]">
                <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <span className="text-2xl">📰</span>
                </div>
                <p className="text-gray-400 font-medium">Select an article to start reading</p>
                <p className="text-xs text-gray-600 mt-2">Use <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] rounded border border-[#333] font-mono text-[10px]">j</kbd> and <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] rounded border border-[#333] font-mono text-[10px]">k</kbd> to navigate</p>
            </div>
        );
    }

    // Sanitize content
    const sanitizedContent = DOMPurify.sanitize(article.content || '');

    return (
        <div className="h-full overflow-y-auto bg-[#0a0a0a] custom-scrollbar">
            <div className="max-w-3xl mx-auto px-8 py-10">
                <header className="mb-10 border-b border-[#222] pb-6">
                    <div className="flex items-center gap-2 mb-4 text-xs font-medium text-blue-500 uppercase tracking-wider">
                        <span>{article.feed_title}</span>
                    </div>

                    <h1 className="text-4xl font-bold text-gray-100 mb-6 leading-tight tracking-tight">
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-400 transition-colors"
                        >
                            {article.title}
                        </a>
                    </h1>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-6">
                            {article.published_at && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{format(new Date(article.published_at), 'MMMM do, yyyy')}</span>
                                </div>
                            )}
                            {article.author && (
                                <div className="flex items-center gap-2">
                                    <User size={14} />
                                    <span className="truncate max-w-[200px]">{article.author}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => markArticleSaved(article.id, !article.is_saved)}
                                className={`
                                    p-2 rounded-md transition-all border
                                    ${article.is_saved
                                        ? 'bg-amber-900/20 text-amber-500 border-amber-900/30'
                                        : 'bg-[#151515] text-gray-400 border-[#222] hover:bg-[#202020] hover:text-white'}
                                `}
                                title={article.is_saved ? "Unsave" : "Save for later"}
                            >
                                <Star size={18} fill={article.is_saved ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={() => markArticleRead(article.id, !article.is_read)}
                                className={`
                                    p-2 rounded-md transition-all border
                                    ${article.is_read
                                        ? 'bg-[#151515] text-green-500 border-[#222] hover:bg-green-900/20'
                                        : 'bg-[#151515] text-gray-400 border-[#222] hover:bg-[#202020] hover:text-white'}
                                `}
                                title={article.is_read ? "Mark as unread" : "Mark as read"}
                            >
                                <Check size={18} />
                            </button>
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-md bg-[#151515] text-gray-400 border border-[#222] hover:bg-[#202020] hover:text-white transition-all"
                                title="Open in browser"
                            >
                                <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>
                </header>

                <article
                    className="
                        prose prose-invert prose-lg max-w-none 
                        prose-headings:text-gray-100 prose-headings:font-bold
                        prose-p:text-gray-300 prose-p:leading-relaxed
                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-white
                        prose-code:text-blue-300 prose-code:bg-blue-900/20 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-[#151515] prose-pre:border prose-pre:border-[#222]
                        prose-img:rounded-xl prose-img:shadow-lg
                        prose-blockquote:border-blue-500 prose-blockquote:bg-blue-900/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                        text-gray-300
                    "
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />

                <div className="mt-16 pt-8 border-t border-[#222] text-center">
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#151515] hover:bg-[#202020] text-gray-300 rounded-lg transition-colors border border-[#222] text-sm font-medium">
                        Read full article on website <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}
