import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversationStore } from '../../store/useConversationStore';

// Mock fetch
global.fetch = vi.fn();

describe('useConversationStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useConversationStore.getState().clearMessages();
    useConversationStore.getState().setConversationId(null);
  });

  it('sendMessage calls gRPC if provided', async () => {
    const sendViaGrpc = vi.fn();
    const { result } = renderHook(() => useConversationStore());

    await act(async () => {
      await result.current.sendMessage('Hello gRPC', 'fake-token', [], sendViaGrpc);
    });

    // Check gRPC call
    expect(sendViaGrpc).toHaveBeenCalledWith('Hello gRPC');
    // Check fetch NOT called
    expect(fetch).not.toHaveBeenCalled();

    // Optimistic update was removed, so messages should be empty until stream/sync adds them
    expect(result.current.messages).toHaveLength(0);
  });

  it('sendMessage falls back to REST if gRPC fails', async () => {
    const sendViaGrpc = vi.fn(() => { throw new Error('gRPC failed'); });

    // Mock successful REST response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'REST Response', sessionId: 'new-session' })
    });

    const { result } = renderHook(() => useConversationStore());

    await act(async () => {
      await result.current.sendMessage('Hello REST', 'fake-token', [], sendViaGrpc);
    });

    // Check gRPC call happened and failed
    expect(sendViaGrpc).toHaveBeenCalled();

    // Check fetch called
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Hello REST')
      })
    );

    // Check session update
    expect(result.current.conversationId).toBe('new-session');

    // Check assistant response added (REST mechanism)
    expect(result.current.messages).toHaveLength(1); // Only assistant response
    expect(result.current.messages[0].message).toBe('REST Response');
    expect(result.current.messages[0].type).toBe('gnani');
  });

  it('sendMessage uses REST if sendViaGrpc is undefined', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'REST Only' })
    });

    const { result } = renderHook(() => useConversationStore());

    await act(async () => {
      await result.current.sendMessage('Hello No-gRPC', 'fake-token', undefined);
    });

    expect(fetch).toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(1); // Only assistant response
    expect(result.current.messages[0].message).toBe('REST Only');
  });
});
