import React, { useState } from 'react';
import { Mic, Check, AlertCircle } from 'lucide-react';

interface WakeWordTrainerProps {
    onComplete: (modelPath: string) => void;
}

const WakeWordTrainer: React.FC<WakeWordTrainerProps> = ({ onComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [samples, setSamples] = useState<Blob[]>([]);
    const [isTraining, setIsTraining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recordSample = async () => {
        try {
            setIsRecording(true);
            setError(null);

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setSamples([...samples, blob]);
                stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
            };

            mediaRecorder.start();

            // Record for 3 seconds
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 3000);
        } catch (err) {
            setError('Failed to access microphone');
            setIsRecording(false);
        }
    };

    const trainWakeWord = async () => {
        setIsTraining(true);
        setError(null);

        try {
            // In production, this would send samples to Porcupine training API
            // For now, simulate training
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Simulate model path
            const modelPath = `/models/custom_wake_word_${Date.now()}.ppn`;
            onComplete(modelPath);
        } catch (err) {
            setError('Failed to train wake word model');
        } finally {
            setIsTraining(false);
        }
    };

    const resetTraining = () => {
        setSamples([]);
        setError(null);
    };

    return (
        <div className="p-6 bg-black/40 border border-cyan-500/30 rounded">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">Train Your Wake Word</h3>
            <p className="text-cyan-500/60 mb-4">
                Record your wake word 5 times to create a custom model
            </p>

            {/* Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-cyan-500/80">Progress</span>
                    <span className="text-sm text-cyan-400 font-medium">{samples.length}/5 samples</span>
                </div>
                <div className="w-full bg-cyan-500/20 rounded-full h-2">
                    <div
                        className="bg-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${(samples.length / 5) * 100}%` }}
                    />
                </div>
            </div>

            {/* Samples */}
            <div className="grid grid-cols-5 gap-2 mb-6">
                {[...Array(5)].map((_, index) => (
                    <div
                        key={index}
                        className={`aspect-square rounded border-2 flex items-center justify-center ${index < samples.length
                                ? 'border-green-500 bg-green-500/20'
                                : 'border-cyan-500/30 bg-black/40'
                            }`}
                    >
                        {index < samples.length ? (
                            <Check size={24} className="text-green-400" />
                        ) : (
                            <span className="text-cyan-500/60 text-lg">{index + 1}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-red-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {samples.length < 5 ? (
                    <button
                        onClick={recordSample}
                        disabled={isRecording}
                        className="flex-1 px-4 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                        {isRecording ? 'Recording...' : `Record Sample ${samples.length + 1}/5`}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={trainWakeWord}
                            disabled={isTraining}
                            className="flex-1 px-4 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTraining ? 'Training Model...' : 'Train Model'}
                        </button>
                        <button
                            onClick={resetTraining}
                            disabled={isTraining}
                            className="px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>
                    </>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                <p className="text-xs text-cyan-500/80">
                    <strong>Tips:</strong> Speak clearly and consistently. Record in a quiet environment.
                    Say your wake word the same way each time.
                </p>
            </div>
        </div>
    );
};

export default WakeWordTrainer;
