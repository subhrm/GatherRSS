import React, { useMemo, useState } from 'react';
import { useApp, Group, Feed } from '../../context/AppContext';
import {
    Plus,
    Folder,
    FolderPlus,
    FolderOpen,
    Rss,
    Settings,
    Inbox,
    Bookmark,
    ChevronRight,
    ChevronDown,
    Activity,
    Trash2,
    Edit2
} from 'lucide-react';

interface TreeNode {
    type: 'group' | 'feed';
    id: number;
    title: string;
    data: Group | Feed;
    children?: TreeNode[];
}

export function Sidebar() {
    const {
        feeds,
        groups,
        selectedFeedId,
        selectedGroupId,
        selectedFilter,
        selectFeed,
        selectGroup,
        selectFilter,
        addFeed,
        createGroup,
        renameGroup,
        deleteGroup,
        moveFeedToGroup,
        importOpml,
        setShowSettings
    } = useApp();

    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
    const [showAddFeed, setShowAddFeed] = useState(false);
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [newFeedUrl, setNewFeedUrl] = useState('');
    const [newGroupName, setNewGroupName] = useState('');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        type: 'group' | 'feed';
        id: number;
    } | null>(null);

    // Editing State (Rename)
    const [editingNode, setEditingNode] = useState<{ type: 'group', id: number, name: string } | null>(null);

    const toggleGroup = (groupId: number) => {
        const next = new Set(expandedGroups);
        if (next.has(groupId)) {
            next.delete(groupId);
        } else {
            next.add(groupId);
        }
        setExpandedGroups(next);
    };

    const tree = useMemo(() => {
        const nodes: TreeNode[] = [];
        const groupMap = new Map<number, TreeNode>();

        // Create group nodes
        groups.forEach(group => {
            groupMap.set(group.id, {
                type: 'group',
                id: group.id,
                title: group.name,
                data: group,
                children: []
            });
        });

        // Populate hierarchy
        groups.forEach(group => {
            const node = groupMap.get(group.id)!;
            if (group.parent_id && groupMap.has(group.parent_id)) {
                groupMap.get(group.parent_id)!.children!.push(node);
            } else {
                nodes.push(node);
            }
        });

        // Add feeds to groups or root
        feeds.forEach(feed => {
            const node: TreeNode = {
                type: 'feed',
                id: feed.id,
                title: feed.title,
                data: feed
            };
            if (feed.group_id && groupMap.has(feed.group_id)) {
                groupMap.get(feed.group_id)!.children!.push(node);
            } else {
                nodes.push(node);
            }
        });

        return nodes;
    }, [feeds, groups]);

    const handleAddFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeedUrl) return;
        await addFeed(newFeedUrl);
        setNewFeedUrl('');
        setShowAddFeed(false);
    };

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName) return;
        await createGroup(newGroupName);
        setNewGroupName('');
        setShowAddGroup(false);
    };

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNode || !editingNode.name) return;
        await renameGroup(editingNode.id, editingNode.name);
        setEditingNode(null);
    };

    const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: node.type,
            id: node.id
        });
    };

    const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
        if (node.type === 'feed') {
            e.dataTransfer.setData('feedId', node.id.toString());
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    const handleDragOver = (e: React.DragEvent, node: TreeNode) => {
        if (node.type === 'group') {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('bg-blue-600/10');
        } else if (node.type === 'feed' && !(node.data as Feed).group_id) {
            // Optional: Allow dropping on root feeds to move out of folder?
            // Or allow dropping on "All Feeds" area?
            // For now, only folders.
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-blue-600/10');
    };

    const handleDrop = async (e: React.DragEvent, targetNode: TreeNode) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-600/10');
        const feedId = e.dataTransfer.getData('feedId');

        if (feedId && targetNode.type === 'group') {
            await moveFeedToGroup(parseInt(feedId), targetNode.id);
        }
    };

    const renderNode = (node: TreeNode, depth = 0) => {
        const isExpanded = node.type === 'group' && expandedGroups.has(node.id);
        const isSelected =
            (node.type === 'feed' && selectedFeedId === node.id) ||
            (node.type === 'group' && selectedGroupId === node.id);
        const isEditing = editingNode?.id === node.id && editingNode?.type === node.type;

        return (
            <div key={`${node.type}-${node.id}`}>
                <div
                    className={`
                        flex items-center px-3 py-2 mx-2 rounded-md cursor-pointer text-sm transition-all duration-200 select-none
                        ${isSelected
                            ? 'bg-blue-600/20 text-blue-100 font-medium'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
                    `}
                    style={{ paddingLeft: `${depth * 12 + 12}px` }}
                    onClick={() => {
                        if (node.type === 'group') {
                            toggleGroup(node.id);
                            selectGroup(node.id);
                        } else {
                            selectFeed(node.id);
                        }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, node)}
                    draggable={node.type === 'feed'}
                    onDragStart={(e) => handleDragStart(e, node)}
                    onDragOver={(e) => handleDragOver(e, node)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, node)}
                >
                    {node.type === 'group' && (
                        <span className="mr-1 opacity-70">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    )}
                    {node.type === 'group' ? (
                        isExpanded ? <FolderOpen size={16} className="mr-2.5 text-blue-400" /> : <Folder size={16} className="mr-2.5 text-blue-400" />
                    ) : (
                        <div className="mr-2.5 relative">
                            {/* Fallback icon or fetch favicon if available (TODO) */}
                            <Rss size={16} className={isSelected ? "text-blue-400" : "text-orange-400/80"} />
                        </div>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleRename} className="flex-1" onClick={e => e.stopPropagation()}>
                            <input
                                autoFocus
                                className="w-full bg-[#111] border border-blue-500 rounded px-1 py-0.5 text-xs text-white outline-none"
                                value={editingNode.name}
                                onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
                                onBlur={() => setEditingNode(null)}
                            />
                        </form>
                    ) : (
                        <span className="truncate flex-1">{node.title}</span>
                    )}
                </div>

                {node.type === 'group' && isExpanded && node.children && (
                    <div className="mt-0.5">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="w-64 bg-[#111111] flex flex-col h-full border-r border-[#222] relative"
            onClick={() => setContextMenu(null)}
        >
            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-[#222] border border-[#333] rounded-md shadow-xl py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.type === 'group' ? (
                        <>
                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                                onClick={() => {
                                    const group = groups.find(g => g.id === contextMenu.id);
                                    if (group) setEditingNode({ type: 'group', id: group.id, name: group.name });
                                    setContextMenu(null);
                                }}
                            >
                                <Edit2 size={14} /> Rename
                            </button>
                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-2"
                                onClick={() => {
                                    if (confirm('Are you sure? Feeds will be moved to root.')) {
                                        deleteGroup(contextMenu.id);
                                    }
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Move to...</div>
                            <button
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-blue-600 hover:text-white pl-6"
                                onClick={() => {
                                    moveFeedToGroup(contextMenu.id, null);
                                    setContextMenu(null);
                                }}
                            >
                                Root
                            </button>
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-blue-600 hover:text-white pl-6 truncate"
                                    onClick={() => {
                                        moveFeedToGroup(contextMenu.id, group.id);
                                        setContextMenu(null);
                                    }}
                                >
                                    {group.name}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Header / Brand */}
            <div className="h-14 px-4 flex items-center justify-between shrink-0 drag">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Activity size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-100 text-base tracking-tight">Gather<span className="text-blue-500">RSS</span></span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowAddGroup(!showAddGroup)}
                        className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors no-drag"
                        title="New Folder"
                    >
                        <FolderPlus size={18} />
                    </button>
                    <button
                        onClick={() => setShowAddFeed(!showAddFeed)}
                        className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors no-drag"
                        title="Add Feed"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Add Feed Input */}
            {showAddFeed && (
                <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleAddFeed} className="relative">
                        <input
                            type="url"
                            value={newFeedUrl}
                            onChange={(e) => setNewFeedUrl(e.target.value)}
                            placeholder="Paste RSS link..."
                            className="w-full pl-3 pr-8 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="absolute right-1 top-1 p-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                            disabled={!newFeedUrl}
                        >
                            <Plus size={14} />
                        </button>
                    </form>
                </div>
            )}

            {/* Add Group Input */}
            {showAddGroup && (
                <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleAddGroup} className="relative">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Folder name..."
                            className="w-full pl-3 pr-8 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="absolute right-1 top-1 p-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                            disabled={!newGroupName}
                        >
                            <Plus size={14} />
                        </button>
                    </form>
                </div>
            )}

            {/* Smart Filters */}
            <div className="px-2 py-2 space-y-0.5">
                {[
                    { id: 'all', label: 'All Articles', icon: Inbox },
                    { id: 'unread', label: 'Unread', icon: Inbox, count: true }, // Count logic TODO
                    { id: 'saved', label: 'Saved', icon: Bookmark }
                ].map((item: any) => (
                    <div
                        key={item.id}
                        className={`
                            flex items-center px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-all select-none
                            ${selectedFilter === item.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
                        `}
                        onClick={() => selectFilter(item.id)}
                    >
                        <item.icon size={16} className={`mr-3 ${selectedFilter === item.id ? 'text-blue-200' : 'opacity-70'}`} />
                        {item.label}
                    </div>
                ))}
            </div>

            {/* Feeds List */}
            <div className="flex-1 overflow-y-auto px-0 py-2 custom-scrollbar">
                <div className="px-5 pb-2 pt-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    Subscriptions
                </div>
                <div className="space-y-0.5">
                    {tree.map(node => renderNode(node))}
                </div>

                {tree.length === 0 && (
                    <div className="px-5 py-8 text-center text-gray-600 text-sm">
                        <p>No feeds yet.</p>
                        <p className="text-xs mt-1">Click + to add one.</p>
                    </div>
                )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-[#222] flex gap-2">
                <button
                    onClick={importOpml}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-md transition-all border border-transparent hover:border-[#333]"
                >
                    Import OPML
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-md transition-all border border-transparent hover:border-[#333]"
                    title="Settings"
                >
                    <Settings size={16} />
                </button>
            </div>
        </div>
    );
}
