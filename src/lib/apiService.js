import { API_URL } from 'config/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errMsg = 'Unknown error';
        if (errData?.detail) {
            errMsg = typeof errData.detail === 'string'
                ? errData.detail
                : (Array.isArray(errData.detail) ? errData.detail.map(e => e.msg || JSON.stringify(e)).join(', ') : 'Unknown error');
        } else if (errData?.message) {
            errMsg = errData.message;
        }

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('selectedLocation');
            window.location.href = '#/login';
            throw new Error('Session expired. Please login again.');
        }

        throw new Error(errMsg);
    }
    // Handle cases where 204 No Content is returned, to prevent JSON parse errors
    if (response.status === 204) return null;
    return response.json();
};

export const apiService = {
    // Controllers
    getControllers: async (locId) => {
        const response = await fetch(`${API_URL}/config/get-controllers/?location=${locId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    createController: async (payload) => {
        const response = await fetch(`${API_URL}/config/create-controller`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    updateController: async (id, payload) => {
        const response = await fetch(`${API_URL}/config/update-controller/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    deleteController: async (id) => {
        const response = await fetch(`${API_URL}/config/delete-controller/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Walls
    getWalls: async (locId) => {
        const response = await fetch(`${API_URL}/config/get-walls?location=${locId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    createWall: async (payload) => {
        const response = await fetch(`${API_URL}/config/create-wall`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    updateWall: async (id, payload) => {
        const response = await fetch(`${API_URL}/config/update-wall/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    deleteWall: async (id) => {
        const response = await fetch(`${API_URL}/config/delete-wall/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Cupboards
    getCupboards: async (locId) => {
        const response = await fetch(`${API_URL}/config/get-cupboards?location=${locId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    createCupboard: async (payload) => {
        const response = await fetch(`${API_URL}/config/create-cupboard`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    updateCupboard: async (id, payload) => {
        const response = await fetch(`${API_URL}/config/update-cupboard/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    deleteCupboard: async (id) => {
        const response = await fetch(`${API_URL}/config/delete-cupboard/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Shelves
    getShelves: async (locId) => {
        const response = await fetch(`${API_URL}/config/get-shelves?location=${locId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    createShelf: async (payload) => {
        const response = await fetch(`${API_URL}/config/create-shelf`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    updateShelf: async (id, payload) => {
        const response = await fetch(`${API_URL}/config/update-shelf/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    deleteShelf: async (id) => {
        const response = await fetch(`${API_URL}/config/delete-shelf/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};
