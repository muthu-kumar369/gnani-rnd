import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/client';
import { useThemeStore } from '../../store/themeStore';

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
    const { theme } = useThemeStore();

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
            const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                api.get(`/session-replay/${sessionId}`)
            ));
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
        <div className={`rounded-lg border p-6 transition-all ${theme === 'dark' ? 'bg-gray-900 border-cyan-500/30' : 'bg-gray-50 border-blue-200'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>Session Replay</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Timeline */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className={theme === 'dark' ? 'text-cyan-500' : 'text-blue-500'} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Event {currentIndex + 1} of {events.length}
                    </span>
                </div>
                <div className={`relative h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div
                        className={`absolute h-full transition-all ${theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'}`}
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
                                ? (theme === 'dark' ? 'bg-cyan-400 scale-150' : 'bg-blue-500 scale-150')
                                : (theme === 'dark' ? 'bg-gray-600 hover:bg-cyan-500' : 'bg-gray-300 hover:bg-blue-400')
                                }`}
                            style={{ left: `${(index / (events.length - 1)) * 100}%` }}
                            title={formatTimestamp(event.timestamp)}
                        />
                    ))}
                </div>
            </div>

            {/* Event Display */}
            {events.length > 0 ? (
                <>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-lg p-4 mb-6 min-h-[200px] border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}
                    >
                        {currentEvent && (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`font-semibold ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>{currentEvent.type}</span>
                                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {formatTimestamp(currentEvent.timestamp)}
                                    </span>
                                </div>
                                <pre className={`text-sm overflow-auto max-h-[300px] custom-scrollbar ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {JSON.stringify(currentEvent.data, null, 2)}
                                </pre>
                                {currentEvent.metadata && (
                                    <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Metadata</div>
                                        <pre className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-cyan-400' : 'bg-white border border-gray-200 hover:bg-gray-50 text-blue-500 shadow-sm'}`}
                            >
                                <SkipBack size={20} />
                            </button>
                            <button
                                onClick={handlePlayPause}
                                className={`p-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'}`}
                            >
                                {isPlaying ? (
                                    <Pause size={24} />
                                ) : (
                                    <Play size={24} />
                                )}
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentIndex === events.length - 1}
                                className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-cyan-400' : 'bg-white border border-gray-200 hover:bg-gray-50 text-blue-500 shadow-sm'}`}
                            >
                                <SkipForward size={20} />
                            </button>
                        </div>

                        {/* Speed Control */}
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Speed:</span>
                            {[0.5, 1, 2, 4].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${playbackSpeed === speed
                                        ? (theme === 'dark' ? 'bg-cyan-600 text-white' : 'bg-blue-600 text-white')
                                        : (theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')
                                        }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className={`p-4 rounded-full mb-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <Clock size={32} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} />
                    </div>
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>No Events Found</h3>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        This session exists but contains no replayable events.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SessionReplayViewer;
