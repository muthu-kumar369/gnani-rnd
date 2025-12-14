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
        <div className="p-6 bg-canvas-panel border border-gnani-primary/30 rounded">
            <h3 className="text-xl font-semibold text-gnani-primary mb-2">Train Your Wake Word</h3>
            <p className="text-gnani-primary/60 mb-4">
                Record your wake word 5 times to create a custom model
            </p>

            {/* Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gnani-primary/80">Progress</span>
                    <span className="text-sm text-gnani-primary font-medium">{samples.length}/5 samples</span>
                </div>
                <div className="w-full bg-gnani-primary/20 rounded-full h-2">
                    <div
                        className="bg-gnani-primary h-2 rounded-full transition-all"
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
                            ? 'border-status-success bg-status-success/20'
                            : 'border-gnani-primary/30 bg-canvas-panel'
                            }`}
                    >
                        {index < samples.length ? (
                            <Check size={24} className="text-status-success" />
                        ) : (
                            <span className="text-gnani-primary/60 text-lg">{index + 1}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 rounded flex items-center gap-2 text-status-error">
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
                        className="flex-1 px-4 py-3 bg-gnani-primary/20 text-gnani-primary border border-gnani-primary/30 rounded hover:bg-gnani-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                        {isRecording ? 'Recording...' : `Record Sample ${samples.length + 1}/5`}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={trainWakeWord}
                            disabled={isTraining}
                            className="flex-1 px-4 py-3 bg-status-success/20 text-status-success border border-status-success/30 rounded hover:bg-status-success/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTraining ? 'Training Model...' : 'Train Model'}
                        </button>
                        <button
                            onClick={resetTraining}
                            disabled={isTraining}
                            className="px-4 py-3 bg-status-error/20 text-status-error border border-status-error/30 rounded hover:bg-status-error/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>
                    </>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-4 p-3 bg-gnani-primary/10 border border-gnani-primary/20 rounded">
                <p className="text-xs text-gnani-primary/80">
                    <strong>Tips:</strong> Speak clearly and consistently. Record in a quiet environment.
                    Say your wake word the same way each time.
                </p>
            </div>
        </div>
    );
};

export default WakeWordTrainer;
