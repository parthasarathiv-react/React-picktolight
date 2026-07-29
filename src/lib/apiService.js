import { API_URL } from 'config/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const extractErrorMessage = (errData) => {
    if (!errData) return 'Unknown error';

    if (errData.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
        return errData.errors
            .map(e => {
                if (typeof e === 'string') return e;
                if (e?.msg) return e.msg;
                if (e?.detail) return e.detail;
                return JSON.stringify(e);
            })
            .join('; ');
    }

    if (errData.detail) {
        if (typeof errData.detail === 'string') return errData.detail;
        if (Array.isArray(errData.detail) && errData.detail.length > 0) {
            return errData.detail
                .map(e => {
                    if (typeof e === 'string') return e;
                    if (e?.msg) return e.msg;
                    return JSON.stringify(e);
                })
                .join('; ');
        }
    }

    if (errData.message && typeof errData.message === 'string') {
        return errData.message;
    }

    return 'Unknown error';
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errMsg = extractErrorMessage(errData);

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('selectedLocation');
            window.location.href = '#/login';
            const err = new Error('Session expired. Please login again.');
            err.raw = errData;
            throw err;
        }

        const err = new Error(errMsg);
        err.raw = errData;
        err.fieldErrors = errData?.errors || errData?.detail;
        throw err;
    }
    // Handle cases where 204 No Content is returned, to prevent JSON parse errors
    if (response.status === 204) return null;

    const data = await response.json();
    if (data && data.success === false) {
        let errMsg = extractErrorMessage(data);
        const err = new Error(errMsg);
        err.raw = data;
        err.fieldErrors = data?.errors || data?.detail;
        throw err;
    }

    return data;
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
    },
    disableShelf: async (id, status = true) => {
        const response = await fetch(`${API_URL}/config/disable-shelf/${id}/${status}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Bins
    getBins: async (locId = 'All', shelfId = 'All') => {
        const response = await fetch(`${API_URL}/config/get-bins?location=${locId}&shelf=${shelfId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    updateBin: async (id, payload) => {
        const response = await fetch(`${API_URL}/config/update-bin/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    deleteBin: async (id) => {
        const response = await fetch(`${API_URL}/config/delete-bin/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    disableBin: async (id, status = true) => {
        const response = await fetch(`${API_URL}/config/disable-bin/${id}/${status}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // Users
    getUsers: async () => {
        const response = await fetch(`${API_URL}/users/get-users`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },
    createUser: async (payload) => {
        const response = await fetch(`${API_URL}/users/create-user`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    updateUser: async (id, payload) => {
        const response = await fetch(`${API_URL}/users/update-user/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    deleteUser: async (id) => {
        const response = await fetch(`${API_URL}/users/delete-user/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};
