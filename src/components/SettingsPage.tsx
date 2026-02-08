// import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Monitor, Trash2 } from 'lucide-react';

export function SettingsPage({ onClose }: { onClose: () => void }) {
    const { feeds, refreshFeeds } = useApp();

    return (
        <div className="absolute inset-0 bg-gray-950 z-50 flex flex-col">
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <button onClick={onClose} className="px-4 py-2 bg-blue-600 rounded text-white text-sm">Done</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
                {/* Appearance */}
                <section className="mb-10">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-800 pb-2">Appearance</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button className="flex flex-col items-center p-4 bg-gray-900 rounded-lg border border-blue-500 text-blue-400">
                            <Monitor size={24} className="mb-2" />
                            <span>System</span>
                        </button>
                        <button className="flex flex-col items-center p-4 bg-gray-900 rounded-lg border border-gray-800 text-gray-400 hover:border-gray-700">
                            <Moon size={24} className="mb-2" />
                            <span>Dark</span>
                        </button>
                        <button className="flex flex-col items-center p-4 bg-gray-900 rounded-lg border border-gray-800 text-gray-400 hover:border-gray-700">
                            <Sun size={24} className="mb-2" />
                            <span>Light</span>
                        </button>
                    </div>
                </section>

                {/* Feeds Management */}
                <section className="mb-10">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-800 pb-2">Manage Feeds</h3>
                    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                        {feeds.map(feed => (
                            <div key={feed.id} className="p-4 border-b border-gray-800 last:border-0 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-gray-200">{feed.title}</div>
                                    <div className="text-xs text-gray-500">{feed.url}</div>
                                </div>
                                <button
                                    // onClick={() => deleteFeed(feed.id)} 
                                    className="p-2 text-red-400 hover:bg-gray-800 rounded"
                                    title="Remove Feed"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {feeds.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No feeds added</div>
                        )}
                    </div>
                </section>

                {/* Data */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-800 pb-2">Data</h3>
                    <button
                        onClick={refreshFeeds}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-200 text-sm"
                    >
                        Force Refresh All Feeds
                    </button>
                </section>
            </div>
        </div>
    );
}
