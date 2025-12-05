import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Image, FileText } from 'lucide-react';
import DropdownPortal from '../common/DropdownPortal';

interface AttachmentMenuProps {
    onFileSelect: (file: File) => void;
    onImageSelect: (file: File) => void;
    disabled?: boolean;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onFileSelect, onImageSelect, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleImageClick = () => {
        imageInputRef.current?.click();
        setIsOpen(false);
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
        setIsOpen(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="control-button w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach files"
            >
                <Paperclip size={20} className={`transition-transform ${isOpen ? 'rotate-45' : ''}`} />
            </button>

            <DropdownPortal isOpen={isOpen} buttonRef={buttonRef}>
                <div ref={menuRef}>
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.12 }}
                        className="dropdown-popup w-[130px]"
                    >
                        <button
                            onClick={handleImageClick}
                            className="dropdown-item w-full text-left flex items-center gap-2"
                        >
                            <Image size={14} className="text-cyan-400" />
                            <div>
                                <div className="text-xs font-medium text-cyan-100">Image</div>
                                <div className="text-[9px] text-cyan-500/60">PNG, JPG, GIF, WebP</div>
                            </div>
                        </button>

                        <button
                            onClick={handleFileClick}
                            className="dropdown-item w-full text-left flex items-center gap-2"
                        >
                            <FileText size={14} className="text-cyan-400" />
                            <div>
                                <div className="text-xs font-medium text-cyan-100">Document</div>
                                <div className="text-[9px] text-cyan-500/60">PDF, DOC, TXT, MD</div>
                            </div>
                        </button>
                    </motion.div>
                </div>
            </DropdownPortal>

            {/* Hidden file inputs */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleImageChange}
                className="hidden"
            />
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
};

export default AttachmentMenu;
