import { AppProvider, useApp } from './context/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { ArticleList } from './components/feed/ArticleList'
import { ArticleView } from './components/feed/ArticleView'
import { SettingsPage } from './components/SettingsPage'
import { Search } from 'lucide-react'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function AppContent() {
  const {
    articles,
    selectedArticleId,
    selectArticle,
    markArticleRead,
    isLoading,
    showSettings,
    setShowSettings,
    searchQuery,
    setSearchQuery
  } = useApp();

  useKeyboardShortcuts();

  const selectedArticle = articles.find(a => a.id === selectedArticleId) || null;

  return (
    <div className="flex h-screen bg-black text-gray-200 overflow-hidden font-sans relative">
      <Sidebar />

      {/* Article List Pane */}
      <div className="w-80 border-r border-[#222] flex flex-col bg-[#111111]">
        {/* Search Header */}
        <div className="p-3 border-b border-[#222] sticky top-0 bg-[#111111] z-10 shrink-0">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] text-gray-200 pl-9 pr-3 py-2 rounded-lg text-sm border border-[#333] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder-gray-600 transition-all"
            />
          </div>
        </div>

        {/* List Meta */}
        <div className="px-4 py-2 border-b border-[#1f1f1f] bg-[#111111] flex justify-between items-center shrink-0">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {articles.length} Article{articles.length !== 1 ? 's' : ''}
          </span>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              SYNCING
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 min-h-0">
          <ArticleList
            onSelectArticle={(article) => {
              selectArticle(article.id);
              if (!article.is_read) {
                markArticleRead(article.id, true);
              }
            }}
            selectedArticleId={selectedArticleId}
          />
        </div>
      </div>

      {/* Reader Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        <ArticleView article={selectedArticle} />
      </main>

      {/* Settings Overlay */}
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
