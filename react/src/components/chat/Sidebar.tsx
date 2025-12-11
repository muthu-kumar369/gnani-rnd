import React, { useState, useEffect, useRef } from 'react';
import { Settings, LogOut, Plus, MessageSquare, User, MoreHorizontal, Trash2, Edit2, Check, X, Moon, Keyboard, Search, BarChart3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useConversationHistory } from '../../hooks/useConversationHistory';
import ConfirmationModal from '../ui/ConfirmationModal';

interface SidebarProps {
    onNewChat: () => void;
    onOpenAnalytics: () => void;
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewChat, onOpenAnalytics, className = '' }) => {
    const { user, logout, accessToken } = useUserStore();
    const navigate = useNavigate();

    // Use the history hook for list management (search, pagination)
    const {
        conversations,
        fetchConversations,
        loadMore,
        search,
        isLoading,
        hasMore,
        deleteConversation,
        updateTitle
    } = useConversationHistory();

    const {
        setConversationId,
        conversationId,
        refreshConversation
    } = useConversationStore();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Refs for clicking outside
    const menuRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Initial fetch
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            search(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, search]);

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectChat = (id: string) => {
        if (editingId === id) return; // Don't switch if editing this one
        setConversationId(id);
        if (accessToken) {
            refreshConversation(accessToken);
        }
        // No need to close sidebar in desktop view
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
        setMenuOpenId(null);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        await deleteConversation(deleteId);
        setDeleteId(null);
        // If current was deleted, clear selection (optional, but good UX)
        if (conversationId === deleteId) {
            setConversationId(null);
        }
    };

    const startRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingId(id);
        setEditTitle(currentTitle);
        setMenuOpenId(null);
    };

    const cancelRename = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingId(null);
        setEditTitle('');
    };

    const saveRename = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!editTitle.trim()) return;
        await updateTitle(id, editTitle);
        setEditingId(null);
        setMenuOpenId(null);
    };

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setMenuOpenId(menuOpenId === id ? null : id);
    };

    // Infinite scroll handler
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
            loadMore();
        }
    };

    return (
        <div className={`flex flex-col h-full bg-jarvis-bg border-r border-jarvis-border/30 w-64 ${className}`}>
            {/* Header / New Chat */}
            <div
                className="flex-1 overflow-y-auto p-4 pb-2 scrollbar-thin scrollbar-thumb-jarvis-border scrollbar-track-transparent"
                onScroll={handleScroll}
            >
                {/* Branding Logo */}
                <div className="flex items-center gap-3 px-2 mb-6 mt-1">
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">
                        Gnani
                    </span>
                </div>

                {/* New Chat Button */}
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-jarvis-blue/20 to-purple-600/20 hover:from-jarvis-blue/30 hover:to-purple-600/30 text-white px-4 py-2.5 rounded-lg transition-all group border border-jarvis-blue/30 hover:border-jarvis-blue/50 mb-2"
                >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">New Chat</span>
                </button>

                {/* STAGE 2: Advanced Search Button */}
                <button
                    onClick={() => navigate('/search')}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all group border border-white/10 hover:border-jarvis-blue/30 mb-2"
                >
                    <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Advanced Search</span>
                </button>

                {/* Search Input */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-jarvis-blue/20 rounded-lg py-1.5 pl-9 pr-4 text-xs text-gray-300 focus:outline-none focus:border-jarvis-blue/50 transition-all placeholder-gray-600"
                    />
                </div>

                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    History
                </div>

                {conversations.length === 0 && !isLoading && (
                    <div className="px-4 py-8 text-center text-xs text-gray-600">
                        {searchQuery ? 'No results found' : 'No conversations yet'}
                    </div>
                )}

                {conversations.map((chat) => (
                    <div key={chat.conversationId} className="relative group/item">
                        {editingId === chat.conversationId ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-jarvis-blue/50">
                                <input
                                    autoFocus
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-0"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveRename(e as any, chat.conversationId);
                                        if (e.key === 'Escape') cancelRename();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button onClick={(e) => saveRename(e, chat.conversationId)} className="p-1 hover:text-green-400 text-gray-400">
                                    <Check size={14} />
                                </button>
                                <button onClick={(e) => cancelRename(e)} className="p-1 hover:text-red-400 text-gray-400">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleSelectChat(chat.conversationId)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:text-jarvis-text hover:bg-white/5 rounded-lg transition-colors group relative ${conversationId === chat.conversationId ? 'bg-jarvis-blue/10 text-jarvis-blue' : 'text-gray-400'
                                    }`}
                            >
                                <MessageSquare className={`w-4 h-4 opacity-50 flex-shrink-0 ${conversationId === chat.conversationId ? 'text-jarvis-blue opacity-100' : ''}`} />
                                <span className="truncate text-sm flex-1 pr-6">{chat.title}</span>

                                <div
                                    onClick={(e) => toggleMenu(e, chat.conversationId)}
                                    className={`absolute right-2 opacity-0 group-hover/item:opacity-100 hover:bg-white/10 p-1 rounded transition-all ${menuOpenId === chat.conversationId ? 'opacity-100 bg-white/10' : ''}`}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </div>
                            </button>
                        )}

                        {/* Context Menu */}
                        {menuOpenId === chat.conversationId && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-32 bg-gray-900 border border-jarvis-border/50 rounded-lg shadow-xl z-20 overflow-hidden backdrop-blur-xl"
                            >
                                <button
                                    onClick={(e) => startRename(e, chat.conversationId, chat.title)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <Edit2 size={12} />
                                    Rename
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, chat.conversationId)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-center py-2">
                        <div className="w-4 h-4 border-2 border-jarvis-blue/30 border-t-jarvis-blue rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* User Profile Area */}
            <div className="p-3 border-t border-jarvis-border/20 z-10" ref={profileRef}>
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-jarvis-blue to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-jarvis-blue/20">
                            {user?.profile?.firstName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-jarvis-text truncate">{user?.profile?.firstName || 'User'} {user?.profile?.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Profile Popover */}
                    {isProfileOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-900 border border-jarvis-border/30 rounded-lg shadow-xl overflow-hidden backdrop-blur-xl">
                            <div className="p-2 space-y-1">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                    <User className="w-4 h-4" />
                                    <span>Profile</span>
                                </button>
                                <button
                                    onClick={() => {
                                        console.log('Opening Analytics via prop');
                                        setIsProfileOpen(false);
                                        onOpenAnalytics();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    <span>Analytics</span>
                                </button>
                                <button

                                    onClick={() => navigate('/settings')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                    <Moon className="w-4 h-4" />
                                    <span>Theme</span>
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                    <Keyboard className="w-4 h-4" />
                                    <span>Keyboard Shortcuts</span>
                                </button>
                                <div className="h-px bg-white/10 my-1" />
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Log out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Conversation"
                message="Are you sure you want to delete this conversation? This action cannot be undone."
                isDangerous={true}
                confirmLabel="Delete"
            />
        </div >
    );
};

export default Sidebar;
