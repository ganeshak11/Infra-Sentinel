import { useState, useEffect, useRef, useCallback } from 'react';

// Empty initial state — all data comes from real backend
const EMPTY_STATS = {
  securityScore: 100,
  totalAlerts: 0,
  blockedAttacks: 0,
  monitoredServers: 1,
  activeThreats: 0,
  alertsDelta: 0,
  blockedDelta: 0,
};

const BACKEND_URL = '';

export function useWebSocket() {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [counters, setCounters] = useState(EMPTY_STATS);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 50)); // keep max 50

    // Update counters
    setCounters((prev) => ({
      ...prev,
      totalAlerts: prev.totalAlerts + 1,
      blockedAttacks: alert.action === 'IP_BLOCKED' ? prev.blockedAttacks + 1 : prev.blockedAttacks,
      activeThreats: alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
        ? prev.activeThreats + 1
        : prev.activeThreats,
    }));
  }, []);

  const connect = useCallback(() => {
    try {
      // Use same host/port as page — goes through nginx /ws proxy
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data);
          addAlert(alert);
        } catch (e) {
          console.error('Failed to parse alert:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 5 seconds
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      // Backend not available — use mock data silently
      setIsConnected(false);
    }
  }, [addAlert]);

  // Fetch existing alerts + stats on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/alerts`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data);
        }
      })
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.totalAlerts === 'number') {
          setCounters(data);
        }
      })
      .catch(() => {});
  }, []);

  // Connect WebSocket
  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  // Health check polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/api/health`)
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false));
    }, 35000);
    return () => clearInterval(interval);
  }, []);

  return { alerts, isConnected, counters, addAlert };
}
