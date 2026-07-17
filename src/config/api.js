const getApiUrl = () => {
    if (process.env.NODE_ENV === "development") {
        return process.env.REACT_APP_API_URL;
    }

    // Fallbacks for production build
    const protocol = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
    const hostname = window.location.hostname;
    const port = process.env.REACT_APP_API_PORT;

    return `${protocol}//${hostname}:${port}/api/v1`;
};

export const API_URL = getApiUrl();

