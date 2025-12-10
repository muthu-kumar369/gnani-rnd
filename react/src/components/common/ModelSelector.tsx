import React from 'react';
import { ChevronDown, Cpu } from 'lucide-react';
import { useModelStore, AVAILABLE_MODELS } from '../../store/useModelStore';

const ModelSelector: React.FC = () => {
    const { currentModel, setModel } = useModelStore();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleModelChange = (modelId: string) => {
        setModel(modelId);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/10 transition-colors text-sm"
            >
                <Cpu size={16} />
                <span>{currentModel.name}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full mt-2 right-0 z-20 w-64 bg-gray-900 border border-cyan-500/30 rounded-lg shadow-lg overflow-hidden">
                        {AVAILABLE_MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => handleModelChange(model.id)}
                                className={`w-full px-4 py-3 text-left hover:bg-cyan-500/10 transition-colors border-b border-cyan-500/10 last:border-b-0 ${currentModel.id === model.id ? 'bg-cyan-500/20' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-cyan-400 font-medium text-sm">
                                        {model.name}
                                    </span>
                                    {currentModel.id === model.id && (
                                        <span className="text-xs text-green-400">✓ Active</span>
                                    )}
                                </div>
                                {model.description && (
                                    <p className="text-xs text-cyan-500/60">{model.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-xs text-cyan-500/50">
                                    <span>{model.provider}</span>
                                    <span>•</span>
                                    <span>{model.maxTokens} tokens</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ModelSelector;
