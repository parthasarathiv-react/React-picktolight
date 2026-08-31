const getApiUrl = () => {
    if (import.meta.env.DEV) {
        return import.meta.env.VITE_API_URL ;
    }

    // Fallbacks for production build
    const protocol = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
    const hostname = window.location.hostname;
    const port = import.meta.env.VITE_API_PORT ;

    return `${protocol}//${hostname}:${port}/api/v1`;
};

const getWsUrl = () => {
    if (import.meta.env.DEV && import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }

    // Auto-derive from VITE_API_URL (replaces http/https with ws/wss and appends /ws)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '/ws');
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const port = import.meta.env.VITE_API_PORT || '8000';

    return `${protocol}//${hostname}:${port}/ws`;
};

export const API_URL = getApiUrl();
export const WS_URL = getWsUrl();

