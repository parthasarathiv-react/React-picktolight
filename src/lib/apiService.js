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
        const response = await fetch(`${API_URL}/config/create-controllers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    updateController: async (id, payload) => {
        const response = await fetch(`${API_URL}/config/update-controllers/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    deleteController: async (id) => {
        const response = await fetch(`${API_URL}/config/delete-controllers/${id}`, {
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
    }
};
