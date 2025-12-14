import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { format } from 'date-fns';
import { Play, Pause, FastForward, SkipBack, Clock, Activity, Terminal } from 'lucide-react';

interface SessionSummary {
    sessionId: string;
    eventCount: number;
    startTime: string;
    endTime: string;
    status: string;
}

interface SessionEvent {
    _id: string;
    sessionId: string;
    type: string;
    data: any;
    timestamp: string;
    metadata?: any;
}

const SessionReplayPage: React.FC = () => {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [events, setEvents] = useState<SessionEvent[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackIndex, setPlaybackIndex] = useState(-1);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [loading, setLoading] = useState(false);

    const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/session/replay/list');
            if (response.data.success) {
                setSessions(response.data.sessions);
            }
        } catch (error) {
            console.error('Failed to load sessions', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async (sessionId: string) => {
        try {
            setLoading(true);
            setSelectedSessionId(sessionId);
            setPlaybackIndex(-1);
            setIsPlaying(false);

            const response = await apiClient.get(`/session/${sessionId}/events`);
            if (response.data.success) {
                setEvents(response.data.events);
            }
        } catch (error) {
            console.error('Failed to load events', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlayback = () => {
        if (isPlaying) {
            pausePlayback();
        } else {
            startPlayback();
        }
    };

    const startPlayback = () => {
        if (playbackIndex >= events.length - 1) {
            setPlaybackIndex(-1);
        }
        setIsPlaying(true);
    };

    const pausePlayback = () => {
        setIsPlaying(false);
        if (playbackTimerRef.current) {
            clearTimeout(playbackTimerRef.current);
        }
    };

    useEffect(() => {
        if (isPlaying && events.length > 0) {
            const playNext = () => {
                setPlaybackIndex(prev => {
                    const next = prev + 1;
                    if (next >= events.length) {
                        setIsPlaying(false);
                        return prev;
                    }

                    // Auto-scroll logic
                    if (scrollRef.current) {
                        const eventEl = document.getElementById(`event-${next}`);
                        if (eventEl) {
                            eventEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }

                    // Determine delay to next event
                    if (next < events.length - 1) {
                        const currentType = events[next].type;
                        // Simulate real timing? Only if timestamps are valid.
                        // For now, fixed delay is better for UX, maybe dynamic based on type.
                        const delay = currentType === 'llm_token' ? 50 : 800;
                        playbackTimerRef.current = setTimeout(playNext, delay / playbackSpeed);
                    } else {
                        setIsPlaying(false);
                    }

                    return next;
                });
            };

            // Start immediately
            playbackTimerRef.current = setTimeout(playNext, 100);
        }

        return () => {
            if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
        };
    }, [isPlaying, events, playbackSpeed]);

    return (
        <div className="flex h-screen bg-canvas-panel text-type-primary overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-line-base flex flex-col">
                <div className="p-4 border-b border-line-base">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity size={20} className="text-gnani-secondary" /> Session Replay
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.map(session => (
                        <div
                            key={session.sessionId}
                            onClick={() => loadEvents(session.sessionId)}
                            className={`p-4 border-b border-line-base cursor-pointer hover:bg-canvas-surface transition-colors ${selectedSessionId === session.sessionId ? 'bg-canvas-surface border-l-4 border-gnani-secondary' : ''}`}
                        >
                            <div className="font-mono text-xs text-type-muted mb-1">{session.sessionId.substring(0, 8)}...</div>
                            <div className="flex items-center gap-2 text-sm mb-1">
                                <Clock size={14} className="text-type-secondary" />
                                {format(new Date(session.startTime), 'MMM d, HH:mm:ss')}
                            </div>
                            <div className="flex justify-between items-center text-xs text-type-secondary">
                                <span className="bg-canvas-surface/80 px-2 py-0.5 rounded-full">{session.eventCount} events</span>
                                <span>{session.status}</span>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && !loading && (
                        <div className="p-8 text-center text-type-muted">No recorded sessions found.</div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full">
                {selectedSessionId ? (
                    <>
                        {/* Header Controls */}
                        <div className="h-16 border-b border-line-base flex items-center justify-between px-6 bg-canvas-panel z-10">
                            <div className="font-mono text-sm text-type-muted">
                                Session: <span className="text-type-primary">{selectedSessionId}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setPlaybackIndex(-1)}
                                    className="p-2 hover:bg-canvas-surface rounded-full"
                                    title="Reset"
                                >
                                    <SkipBack size={20} />
                                </button>
                                <button
                                    onClick={togglePlayback}
                                    className={`p-3 rounded-full ${isPlaying ? 'bg-status-warning hover:bg-status-warning/90' : 'bg-status-success hover:bg-status-success/90'} text-type-inverse shadow-lg transition-all`}
                                >
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                </button>
                                <div className="flex items-center bg-canvas-surface rounded-lg p-1 ml-2 border border-glass-border">
                                    {[1, 2, 5].map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => setPlaybackSpeed(speed)}
                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${playbackSpeed === speed ? 'bg-gnani-primary/20 text-gnani-primary font-medium' : 'text-type-muted hover:text-type-primary hover:bg-glass-hover'}`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Timeline / Event Log */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                            {events.map((event, index) => {
                                const isActive = index === playbackIndex;
                                const isPast = index < playbackIndex;

                                return (
                                    <div
                                        key={event._id || index}
                                        id={`event-${index}`}
                                        className={`relative pl-8 transition-all duration-300 ${isActive ? 'scale-105 opacity-100 z-10' : 'opacity-70 scale-100'} ${isPast ? 'opacity-50' : ''}`}
                                    >
                                        {/* Timeline Line */}
                                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-line-base"></div>

                                        {/* Dot */}
                                        <div className={`absolute left-1.5 top-4 w-3 h-3 rounded-full border-2 ${isActive ? 'bg-gnani-secondary border-gnani-secondary/50 shadow-glass' : 'bg-canvas-surface border-line-base'}`}></div>

                                        {/* Card */}
                                        <div className={`bg-canvas-surface/50 rounded-lg p-4 border ${isActive ? 'border-gnani-secondary shadow-lg ring-1 ring-gnani-secondary/20' : 'border-line-base'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                                                        ${event.type.includes('error') ? 'bg-status-error/20 text-status-error' :
                                                            event.type.includes('llm') ? 'bg-gnani-secondary/20 text-gnani-secondary' :
                                                                event.type.includes('tool') ? 'bg-status-warning/20 text-status-warning' :
                                                                    'bg-canvas-surface text-type-muted'
                                                        }
                                                    `}>
                                                        {event.type}
                                                    </span>
                                                    <span className="text-xs text-type-muted font-mono">
                                                        {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Data View */}
                                            <div className="font-mono text-sm overflow-x-auto bg-canvas-panel p-2 rounded text-type-secondary">
                                                {typeof event.data === 'string' ? event.data : JSON.stringify(event.data, null, 2)}
                                            </div>

                                            {event.metadata && (
                                                <div className="mt-2 pt-2 border-t border-line-base text-xs text-type-muted font-mono">
                                                    Metadata: {JSON.stringify(event.metadata)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {events.length === 0 && (
                                <div className="text-center text-type-muted mt-20">Select a session to view events.</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-type-muted p-10">
                        <Terminal size={64} className="mb-4 opacity-20" />
                        <p className="text-xl">Select a session from the list to replay</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionReplayPage;
