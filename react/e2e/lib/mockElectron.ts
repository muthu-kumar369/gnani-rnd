import { Page } from '@playwright/test';

export async function mockElectron(page: Page) {
    await page.addInitScript(() => {
        const listeners: Record<string, Function[]> = {};
        const streamListeners: Record<string, Function[]> = {};

        (window as any).gnani = {
            on: (channel: string, callback: Function) => {
                if (!listeners[channel]) listeners[channel] = [];
                listeners[channel].push(callback);
                return () => {
                    listeners[channel] = listeners[channel].filter(cb => cb !== callback);
                };
            },
            send: (channel: string, data: any) => {
                console.log(`[MockElectron] send: ${channel}`, data);
            },
            stream: {
                on: (channel: string, callback: Function) => {
                    if (!streamListeners[channel]) streamListeners[channel] = [];
                    streamListeners[channel].push(callback);
                    return () => {
                        streamListeners[channel] = streamListeners[channel].filter(cb => cb !== callback);
                    };
                },
                sendText: (text: string) => {
                    console.log(`[MockElectron] sendText: ${text}`);
                    // Simulate echo/response
                    setTimeout(() => {
                        const segmentId = 'seg-' + Date.now();
                        // Partial
                        // (window as any).triggerStreamEvent('stream:partial', { text: text + '...', segment_id: segmentId }); 
                        // Final
                        // (window as any).triggerStreamEvent('stream:final', { text: text, segment_id: segmentId });

                        // LLM Response
                        (window as any).triggerStreamEvent('stream:llm_chunk', {
                            payload: { type: 'partial', text: 'Response to: ' + text }
                        });
                        setTimeout(() => {
                            (window as any).triggerStreamEvent('stream:llm_chunk', {
                                payload: { type: 'complete_response', text: 'Final: ' + text }
                            });
                        }, 100);
                    }, 500);
                },
                setSessionId: (id: string) => { console.log('setSessionId', id); },
                setConversationId: (id: string) => { console.log('setConversationId', id); },
                startStream: () => { },
                stopStream: () => { },
            },
            notifications: {
                show: (title: string, body: string) => console.log('Notification:', title, body)
            },
            wake: {
                startWakeWord: () => { }
            },
            vad: {
                setSpeaking: () => { }
            }
        };

        // Helper to trigger events from test
        (window as any).triggerGnaniEvent = (channel: string, data: any) => {
            if (listeners[channel]) {
                listeners[channel].forEach(cb => cb(data));
            }
        };
        (window as any).triggerStreamEvent = (channel: string, data: any) => {
            if (streamListeners[channel]) {
                streamListeners[channel].forEach(cb => cb(data));
            }
        };
    });
}
