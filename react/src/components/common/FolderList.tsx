import React, { useState } from 'react';
import { Folder, MoreVertical, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { useFolderStore } from '../../store/useFolderStore';
import CreateFolderModal from './CreateFolderModal';

interface FolderListProps {
    onSelectFolder?: (folderId: string | null) => void;
    selectedFolderId?: string | null;
}

const FolderList: React.FC<FolderListProps> = ({ onSelectFolder, selectedFolderId }) => {
    const { folders, deleteFolder } = useFolderStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const handleDelete = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this folder? Conversations will not be deleted.')) {
            deleteFolder(folderId);
            setMenuOpenId(null);
        }
    };

    return (
        <div className="space-y-2">
            {/* All Conversations */}
            <button
                onClick={() => onSelectFolder?.(null)}
                className={`flex items-center gap-2 w-full p-2 rounded transition-colors ${selectedFolderId === null
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'hover:bg-cyan-500/10 text-cyan-500/80'
                    }`}
            >
                <Folder size={16} />
                <span className="text-sm">All Conversations</span>
            </button>

            {/* Folders */}
            {folders.map((folder) => (
                <div
                    key={folder.id}
                    className="relative group"
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-cyan-500/20');
                    }}
                    onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-cyan-500/20');
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-cyan-500/20');
                        const conversationId = e.dataTransfer.getData('conversationId');
                        if (conversationId) {
                            // This will be handled by parent component
                            window.dispatchEvent(new CustomEvent('folder:drop', {
                                detail: { folderId: folder.id, conversationId }
                            }));
                        }
                    }}
                >
                    <button
                        onClick={() => onSelectFolder?.(folder.id)}
                        className={`flex items-center gap-2 w-full p-2 rounded transition-colors ${selectedFolderId === folder.id
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'hover:bg-cyan-500/10 text-cyan-500/80'
                            }`}
                    >
                        <span className="text-lg">{folder.icon}</span>
                        <span className="text-sm flex-1 text-left">{folder.name}</span>
                        <span className="text-xs text-cyan-500/60">
                            {folder.conversationIds.length}
                        </span>

                        {/* Menu Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === folder.id ? null : folder.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-cyan-500/20 rounded transition-opacity"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </button>

                    {/* Folder Menu */}
                    {menuOpenId === folder.id && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 bg-gray-900 border border-cyan-500/30 rounded shadow-lg overflow-hidden min-w-[150px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Implement edit
                                        setMenuOpenId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                                >
                                    <Edit2 size={14} />
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => handleDelete(folder.id, e)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Create Folder Button */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 w-full p-2 rounded border border-dashed border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-500/60 hover:text-cyan-400 transition-colors"
            >
                <FolderPlus size={16} />
                <span className="text-sm">New Folder</span>
            </button>

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

export default FolderList;
