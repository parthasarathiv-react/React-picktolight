const getApiUrl = () => {
    if (import.meta.env.DEV) {
        return import.meta.env.VITE_API_URL || 'http://172.17.3.174:8000/api/v1';
    }

    // Fallbacks for production build
    const protocol = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
    const hostname = window.location.hostname;
    const port = import.meta.env.VITE_API_PORT || '8000';

    return `${protocol}//${hostname}:${port}/api/v1`;
};

export const API_URL = getApiUrl();
