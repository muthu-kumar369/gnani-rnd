import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/client';

interface SessionEvent {
    id: string;
    type: string;
    timestamp: Date;
    data: any;
    metadata?: any;
}

interface SessionReplayViewerProps {
    sessionId: string;
    onClose?: () => void;
}

const SessionReplayViewer: React.FC<SessionReplayViewerProps> = ({ sessionId, onClose }) => {
    const [events, setEvents] = useState<SessionEvent[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessionData();
    }, [sessionId]);

    useEffect(() => {
        if (!isPlaying || currentIndex >= events.length - 1) return;

        const timer = setTimeout(() => {
            setCurrentIndex(prev => Math.min(prev + 1, events.length - 1));
        }, 1000 / playbackSpeed);

        return () => clearTimeout(timer);
    }, [isPlaying, currentIndex, playbackSpeed, events.length]);

    const fetchSessionData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/session-replay/${sessionId}`);
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Failed to fetch session data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        setCurrentIndex(prev => Math.min(prev + 1, events.length - 1));
        setIsPlaying(false);
    };

    const handlePrevious = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
        setIsPlaying(false);
    };

    const handleSeek = (index: number) => {
        setCurrentIndex(index);
        setIsPlaying(false);
    };

    const formatTimestamp = (timestamp: Date) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const currentEvent = events[currentIndex];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg border border-cyan-500/30 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-cyan-400">Session Replay</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Timeline */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-cyan-500" />
                    <span className="text-sm text-gray-400">
                        Event {currentIndex + 1} of {events.length}
                    </span>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-cyan-500 transition-all"
                        style={{ width: `${((currentIndex + 1) / events.length) * 100}%` }}
                    />
                </div>
                {/* Timeline markers */}
                <div className="relative mt-2">
                    {events.map((event, index) => (
                        <button
                            key={event.id}
                            onClick={() => handleSeek(index)}
                            className={`absolute w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-cyan-400 scale-150'
                                    : 'bg-gray-600 hover:bg-cyan-500'
                                }`}
                            style={{ left: `${(index / (events.length - 1)) * 100}%` }}
                            title={formatTimestamp(event.timestamp)}
                        />
                    ))}
                </div>
            </div>

            {/* Event Display */}
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 rounded-lg p-4 mb-6 min-h-[200px]"
            >
                {currentEvent && (
                    <>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-cyan-400 font-semibold">{currentEvent.type}</span>
                            <span className="text-sm text-gray-500">
                                {formatTimestamp(currentEvent.timestamp)}
                            </span>
                        </div>
                        <pre className="text-sm text-gray-300 overflow-auto">
                            {JSON.stringify(currentEvent.data, null, 2)}
                        </pre>
                        {currentEvent.metadata && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                                <div className="text-xs text-gray-500">Metadata:</div>
                                <pre className="text-xs text-gray-400 mt-1">
                                    {JSON.stringify(currentEvent.metadata, null, 2)}
                                </pre>
                            </div>
                        )}
                    </>
                )}
            </motion.div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <SkipBack size={20} className="text-cyan-400" />
                    </button>
                    <button
                        onClick={handlePlayPause}
                        className="p-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors"
                    >
                        {isPlaying ? (
                            <Pause size={24} className="text-white" />
                        ) : (
                            <Play size={24} className="text-white" />
                        )}
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === events.length - 1}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <SkipForward size={20} className="text-cyan-400" />
                    </button>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Speed:</span>
                    {[0.5, 1, 2, 4].map(speed => (
                        <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${playbackSpeed === speed
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SessionReplayViewer;
