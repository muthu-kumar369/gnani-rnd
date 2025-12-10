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
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Wake Word Settings</h2>
                <p className="text-cyan-500/60">Configure custom wake words to activate Gnani</p>
            </div>

            {/* Listening Status */}
            <div className="mb-6 p-4 bg-black/40 border border-cyan-500/30 rounded">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isListening ? (
                            <Mic size={20} className="text-green-400 animate-pulse" />
                        ) : (
                            <MicOff size={20} className="text-cyan-500/60" />
                        )}
                        <div>
                            <p className="text-cyan-400 font-medium">
                                {isListening ? 'Listening for wake words...' : 'Wake word detection inactive'}
                            </p>
                            <p className="text-xs text-cyan-500/60">
                                {isListening ? 'Say a wake word to activate' : 'Click to start listening'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleListening}
                        className={`px-4 py-2 rounded transition-colors ${isListening
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                            }`}
                    >
                        {isListening ? 'Stop Listening' : 'Start Listening'}
                    </button>
                </div>
            </div>

            {/* Add New Wake Word */}
            <div className="mb-6">
                <label className="block text-sm text-cyan-500/80 mb-2">Add New Wake Word</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddWakeWord()}
                        placeholder="e.g., Hey Assistant"
                        className="flex-1 px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                        onClick={handleAddWakeWord}
                        disabled={!newWord.trim()}
                        className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Custom Wake Word Trainer */}
            <div className="mb-6">
                <button
                    onClick={() => setShowTrainer(!showTrainer)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:from-cyan-500/30 hover:to-purple-500/30 transition-all flex items-center justify-center gap-2"
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
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">Configured Wake Words</h3>
                {wakeWords.map((wakeWord) => (
                    <div
                        key={wakeWord.id}
                        className="p-4 bg-black/40 border border-cyan-500/30 rounded"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Volume2 size={18} className="text-cyan-400" />
                                <span className="text-cyan-400 font-medium">{wakeWord.word}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleWakeWord(wakeWord.id)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${wakeWord.enabled
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}
                                >
                                    {wakeWord.enabled ? 'Enabled' : 'Disabled'}
                                </button>
                                <button
                                    onClick={() => removeWakeWord(wakeWord.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    title="Remove wake word"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Sensitivity Slider */}
                        <div>
                            <label className="block text-xs text-cyan-500/60 mb-1">
                                Sensitivity: {(wakeWord.sensitivity * 100).toFixed(0)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={wakeWord.sensitivity}
                                onChange={(e) => updateSensitivity(wakeWord.id, parseFloat(e.target.value))}
                                className="w-full h-2 bg-cyan-500/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                            <div className="flex justify-between text-xs text-cyan-500/40 mt-1">
                                <span>Less sensitive</span>
                                <span>More sensitive</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {wakeWords.length === 0 && (
                <div className="text-center text-cyan-500/60 py-8">
                    No wake words configured. Add one above to get started.
                </div>
            )}
        </div>
    );
};

export default WakeWordSettings;
