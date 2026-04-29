"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ChainEvent, SubscribePayload } from "@polkadot-feed/shared";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";
const BASE_DELAY = 1_000;
const MAX_DELAY = 30_000;

interface UseEventStreamOptions {
  subscribePayload: SubscribePayload;
  onEvent: (event: ChainEvent) => void;
  enabled?: boolean;
}

/** Custom hook that connects to the WebSocket and emits new events */
export function useEventStream({
  subscribePayload,
  onEvent,
  enabled = true,
}: UseEventStreamOptions): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef<number>(BASE_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);
  const onEventRef = useRef<(event: ChainEvent) => void>(onEvent);
  const payloadRef = useRef<SubscribePayload>(subscribePayload);

  // Keep refs current without triggering reconnects
  useEffect(() => {
    onEventRef.current = onEvent;
  });
  useEffect(() => {
    payloadRef.current = subscribePayload;
    // Re-subscribe if already connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "subscribe", payload: subscribePayload }),
      );
    }
  }, [subscribePayload]);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      if (!mountedRef.current) return;
      reconnectDelayRef.current = BASE_DELAY;
      ws.send(
        JSON.stringify({ type: "subscribe", payload: payloadRef.current }),
      );
    });

    ws.addEventListener("message", (ev: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      let msg: { type: string; payload: unknown };
      try {
        msg = JSON.parse(ev.data) as { type: string; payload: unknown };
      } catch {
        return;
      }

      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", payload: null }));
        return;
      }

      if (msg.type === "new_event") {
        onEventRef.current(msg.payload as ChainEvent);
      }
    });

    ws.addEventListener("close", () => {
      if (!mountedRef.current) return;
      scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      ws.close();
    });
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = reconnectDelayRef.current;
    reconnectDelayRef.current = Math.min(delay * 2, MAX_DELAY);
    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, connect]);
}
