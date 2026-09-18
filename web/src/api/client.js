const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const json = await res.json().catch(() => ({ success: false, message: "Phản hồi không hợp lệ từ server" }));
    if (!res.ok || !json.success) {
        throw new Error(json.message || `Lỗi ${res.status}`);
    }
    return json;
}

export const citizensApi = {
    list(params) {
        const query = new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
        );
        return request(`/api/citizens?${query.toString()}`);
    },
    get(id) {
        return request(`/api/citizens/${id}`);
    },
    create(data) {
        return request(`/api/citizens`, { method: "POST", body: JSON.stringify(data) });
    },
    update(id, data) {
        return request(`/api/citizens/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    remove(id) {
        return request(`/api/citizens/${id}`, { method: "DELETE" });
    },
};
