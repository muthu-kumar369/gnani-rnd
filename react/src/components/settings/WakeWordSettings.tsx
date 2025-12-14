import React, { useState } from 'react';
import { Mic, MicOff, Plus, Trash2, Volume2, Sparkles } from 'lucide-react';
import { useWakeWordStore } from '../../store/useWakeWordStore';
import { useWakeWordDetection } from '../../hooks/useWakeWordDetection';
import WakeWordTrainer from './WakeWordTrainer';

const WakeWordSettings: React.FC = () => {
    const {
        wakeWords,
        addWakeWord,
        removeWakeWord,
        toggleWakeWord,
        updateSensitivity,
    } = useWakeWordStore();

    const { startListening, stopListening, isListening } = useWakeWordDetection();
    const [newWord, setNewWord] = useState('');
    const [showTrainer, setShowTrainer] = useState(false);

    const handleAddWakeWord = () => {
        if (newWord.trim()) {
            addWakeWord(newWord.trim());
            setNewWord('');
        }
    };

    const handleToggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gnani-primary mb-2">Wake Word Settings</h2>
                <p className="text-gnani-primary/60">Configure custom wake words to activate Gnani</p>
            </div>

            {/* Listening Status */}
            <div className="mb-6 p-4 bg-canvas-panel border border-gnani-primary/30 rounded">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isListening ? (
                            <Mic size={20} className="text-status-success animate-pulse" />
                        ) : (
                            <MicOff size={20} className="text-gnani-primary/60" />
                        )}
                        <div>
                            <p className="text-gnani-primary font-medium">
                                {isListening ? 'Listening for wake words...' : 'Wake word detection inactive'}
                            </p>
                            <p className="text-xs text-gnani-primary/60">
                                {isListening ? 'Say a wake word to activate' : 'Click to start listening'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleListening}
                        className={`px-4 py-2 rounded transition-colors ${isListening
                            ? 'bg-status-error/20 text-status-error border border-status-error/30 hover:bg-status-error/30'
                            : 'bg-gnani-primary/20 text-gnani-primary border border-gnani-primary/30 hover:bg-gnani-primary/30'
                            }`}
                    >
                        {isListening ? 'Stop Listening' : 'Start Listening'}
                    </button>
                </div>
            </div>

            {/* Add New Wake Word */}
            <div className="mb-6">
                <label className="block text-sm text-gnani-primary/80 mb-2">Add New Wake Word</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddWakeWord()}
                        placeholder="e.g., Hey Assistant"
                        className="flex-1 px-3 py-2 bg-canvas-panel border border-gnani-primary/30 rounded text-gnani-primary placeholder-gnani-primary/40 focus:outline-none focus:border-gnani-primary"
                    />
                    <button
                        onClick={handleAddWakeWord}
                        disabled={!newWord.trim()}
                        className="px-4 py-2 bg-gnani-primary/20 text-gnani-primary border border-gnani-primary/30 rounded hover:bg-gnani-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Custom Wake Word Trainer */}
            <div className="mb-6">
                <button
                    onClick={() => setShowTrainer(!showTrainer)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gnani-primary/20 to-gnani-secondary/20 text-gnani-primary border border-gnani-primary/30 rounded hover:from-gnani-primary/30 hover:to-gnani-secondary/30 transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles size={18} />
                    <span>Train Custom Wake Word</span>
                </button>
            </div>

            {/* Wake Word Trainer Modal */}
            {showTrainer && (
                <div className="mb-6">
                    <WakeWordTrainer
                        onComplete={(modelPath) => {
                            console.log('Wake word model trained:', modelPath);
                            setShowTrainer(false);
                            // In production, load the model and add to wake words
                        }}
                    />
                </div>
            )}

            {/* Wake Words List */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gnani-primary mb-2">Configured Wake Words</h3>
                {wakeWords.map((wakeWord) => (
                    <div
                        key={wakeWord.id}
                        className="p-4 bg-canvas-panel border border-gnani-primary/30 rounded"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Volume2 size={18} className="text-gnani-primary" />
                                <span className="text-gnani-primary font-medium">{wakeWord.word}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleWakeWord(wakeWord.id)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${wakeWord.enabled
                                        ? 'bg-status-success/20 text-status-success border border-status-success/30'
                                        : 'bg-type-muted/20 text-type-muted border border-type-muted/30'
                                        }`}
                                >
                                    {wakeWord.enabled ? 'Enabled' : 'Disabled'}
                                </button>
                                <button
                                    onClick={() => removeWakeWord(wakeWord.id)}
                                    className="p-2 text-status-error hover:bg-status-error/10 rounded transition-colors"
                                    title="Remove wake word"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Sensitivity Slider */}
                        <div>
                            <label className="block text-xs text-gnani-primary/60 mb-1">
                                Sensitivity: {(wakeWord.sensitivity * 100).toFixed(0)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={wakeWord.sensitivity}
                                onChange={(e) => updateSensitivity(wakeWord.id, parseFloat(e.target.value))}
                                className="w-full h-2 bg-gnani-primary/20 rounded-lg appearance-none cursor-pointer accent-gnani-primary"
                            />
                            <div className="flex justify-between text-xs text-gnani-primary/40 mt-1">
                                <span>Less sensitive</span>
                                <span>More sensitive</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {wakeWords.length === 0 && (
                <div className="text-center text-gnani-primary/60 py-8">
                    No wake words configured. Add one above to get started.
                </div>
            )}
        </div>
    );
};

export default WakeWordSettings;
