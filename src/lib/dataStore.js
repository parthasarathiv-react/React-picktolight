
// ─── Floor Definitions ───────────────────────────────────────────────────────
export const FLOORS_CONFIG = [
    { id: 1, name: 'Floor 1', description: 'Main Pharmacy Floor', status: 'Active' },
    { id: 2, name: 'Floor 2', description: 'Bulk Storage Level', status: 'Active' },
    { id: 3, name: 'Floor 3', description: 'Dispatch / Loading Bay', status: 'Active' },
];

// ─── Controller Definitions ──────────────────────────────────────────────────
export const CONTROLLERS_CONFIG = [
    { id: 1, name: 'Controller A', ip: '192.168.1.101', port: '8080', floor: 'Floor 1', status: 'Online' },
    { id: 2, name: 'Controller B', ip: '192.168.1.102', port: '8080', floor: 'Floor 1', status: 'Online' },
    { id: 3, name: 'Controller C', ip: '192.168.1.103', port: '8080', floor: 'Floor 2', status: 'Online' },
    { id: 4, name: 'Controller D', ip: '192.168.1.104', port: '8080', floor: 'Floor 2', status: 'Online' },
    { id: 5, name: 'Controller E', ip: '192.168.1.105', port: '8080', floor: 'Floor 3', status: 'Online' },
];

// ─── Wall Definitions ────────────────────────────────────────────────────────
export const WALLS_CONFIG = [
    { id: 1, name: 'Wall A', floor: 'Floor 1', controller: 'Controller A', cupboardsCount: 4, status: 'Active' },
    { id: 2, name: 'Wall B', floor: 'Floor 1', controller: 'Controller A', cupboardsCount: 4, status: 'Active' },
    { id: 3, name: 'Wall C', floor: 'Floor 1', controller: 'Controller B', cupboardsCount: 1, status: 'Active' },
    { id: 4, name: 'Wall D', floor: 'Floor 2', controller: 'Controller C', cupboardsCount: 2, status: 'Active' },
    { id: 5, name: 'Wall E', floor: 'Floor 2', controller: 'Controller D', cupboardsCount: 2, status: 'Active' },
    { id: 6, name: 'Wall F', floor: 'Floor 3', controller: 'Controller E', cupboardsCount: 2, status: 'Active' },
];

// ─── Cupboard definitions (mirrors Settings.js cupboardsData) ────────────────
export const CUPBOARDS_CONFIG = [
    { id: 1, name: 'Cupboard A1', shelves: 5, rows: 5, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall A', status: 'Active' },
    { id: 2, name: 'Cupboard A2', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall A', status: 'Active' },
    { id: 3, name: 'Cupboard A3', shelves: 5, rows: 5, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall A', status: 'Active' },
    { id: 4, name: 'Cupboard A4', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall A', status: 'Active' },
    { id: 5, name: 'Cupboard B1', shelves: 5, rows: 5, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall B', status: 'Active' },
    { id: 6, name: 'Cupboard B2', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall B', status: 'Active' },
    { id: 7, name: 'Cupboard B3', shelves: 5, rows: 5, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall B', status: 'Active' },
    { id: 8, name: 'Cupboard B4', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall B', status: 'Active' },
    { id: 9, name: 'Cupboard C1', shelves: 3, rows: 3, columns: 3, ledsPerDrawer: 4, controller: 'Controller B', wall: 'Wall C', status: 'Active' },
    { id: 10, name: 'Cupboard D1', shelves: 5, rows: 5, columns: 5, ledsPerDrawer: 6, controller: 'Controller C', wall: 'Wall D', status: 'Active' },
    { id: 11, name: 'Cupboard D2', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 5, controller: 'Controller C', wall: 'Wall D', status: 'Active' },
    { id: 12, name: 'Cupboard E1', shelves: 4, rows: 4, columns: 3, ledsPerDrawer: 5, controller: 'Controller D', wall: 'Wall E', status: 'Active' },
    { id: 13, name: 'Cupboard E2', shelves: 3, rows: 3, columns: 4, ledsPerDrawer: 4, controller: 'Controller D', wall: 'Wall E', status: 'Active' },
    { id: 14, name: 'Cupboard F1', shelves: 5, rows: 5, columns: 5, ledsPerDrawer: 6, controller: 'Controller E', wall: 'Wall F', status: 'Active' },
    { id: 15, name: 'Cupboard F2', shelves: 4, rows: 4, columns: 5, ledsPerDrawer: 6, controller: 'Controller E', wall: 'Wall F', status: 'Active' },
];

// ─── Hierarchical sample data: floor → controller → wall → cupboards ─────────

// ─── LED colour options ───────────────────────────────────────────────────────
export const LED_COLORS = [
    { value: 'red', label: 'Red', tailwind: 'bg-red-500', hex: '#ef4444' },
    { value: 'green', label: 'Green', tailwind: 'bg-green-500', hex: '#22c55e' },
    { value: 'blue', label: 'Blue', tailwind: 'bg-blue-500', hex: '#3b82f6' },
    { value: 'orange', label: 'Orange', tailwind: 'bg-orange-500', hex: '#f97316' },
    { value: 'purple', label: 'Purple', tailwind: 'bg-purple-500', hex: '#a855f7' },
    { value: 'white', label: 'White', tailwind: 'bg-white', hex: '#ffffff' },
    { value: 'yellow', label: 'Yellow', tailwind: 'bg-yellow-400', hex: '#facc15' },
];


/**
 * EAN assignments shape:
 * {
 *   cupboardId : number,
 *   row        : number,   // 1-indexed (corresponds to shelf number)
 *   col        : number,   // 1-indexed
 *   ean        : string,
 *   label      : string,   // product/item name (optional)
 *   queue      : Array<{ user: string, color: string, count: number }>
 * }
 */
export const EAN_ASSIGNMENTS = [
    // Floor 1 - Cupboard A1 (ledsPerDrawer: 6)
    { cupboardId: 1, row: 1, col: 1, ean: '4006381333931', label: 'Aspirin 500mg', queue: [{ user: 'User 1', color: 'green', count: 2 }, { user: 'User 2', color: 'red', count: 2 }, { user: 'User 3', color: 'yellow', count: 2 }] },
    { cupboardId: 1, row: 1, col: 2, ean: '5000157024626', label: 'Paracetamol 1g', queue: [{ user: 'User 1', color: 'blue', count: 3 }, { user: 'User 2', color: 'orange', count: 3 }] },
    { cupboardId: 1, row: 2, col: 3, ean: '3400936959728', label: 'Ibuprofen 400mg', queue: [{ user: 'User 2', color: 'red', count: 4 }, { user: 'User 4', color: 'purple', count: 2 }] },
    // Floor 1 - Cupboard B1 (ledsPerDrawer: 4)
    { cupboardId: 3, row: 1, col: 1, ean: '5000157065223', label: 'Metformin 500mg', queue: [{ user: 'User 1', color: 'green', count: 2 }, { user: 'User 3', color: 'yellow', count: 2 }] },

    // Floor 2 - Cupboard C1 (ledsPerDrawer: 6)
    { cupboardId: 4, row: 2, col: 2, ean: '3401560172004', label: 'Lisinopril 5mg', queue: [{ user: 'User 1', color: 'green', count: 2 }, { user: 'User 2', color: 'red', count: 2 }, { user: 'User 3', color: 'yellow', count: 2 }] },
    { cupboardId: 4, row: 3, col: 3, ean: '8710400101024', label: 'Omeprazole 20mg', queue: [{ user: 'User 4', color: 'purple', count: 6 }] },

    // Floor 2 - Cupboard D1 (ledsPerDrawer: 5)
    { cupboardId: 6, row: 1, col: 2, ean: '5901030096809', label: 'Vitamin C 1000mg', queue: [{ user: 'User 1', color: 'green', count: 2 }, { user: 'User 2', color: 'red', count: 3 }] },
    { cupboardId: 6, row: 4, col: 1, ean: '4007221031703', label: 'Zinc 10mg', queue: [{ user: 'User 3', color: 'yellow', count: 1 }, { user: 'User 4', color: 'blue', count: 4 }] },

    // Floor 3 - Cupboard E1 (ledsPerDrawer: 6)
    { cupboardId: 8, row: 1, col: 1, ean: '7350022730018', label: 'Amoxicillin 250', queue: [{ user: 'User 1', color: 'green', count: 2 }, { user: 'User 2', color: 'red', count: 2 }, { user: 'User 3', color: 'yellow', count: 2 }] },
    { cupboardId: 8, row: 5, col: 5, ean: '1234567890123', label: 'Cetirizine 10mg', queue: [{ user: 'User 1', color: 'green', count: 1 }, { user: 'User 2', color: 'red', count: 1 }, { user: 'User 3', color: 'yellow', count: 1 }, { user: 'User 4', color: 'blue', count: 1 }, { user: 'User 5', color: 'purple', count: 1 }, { user: 'User 6', color: 'orange', count: 1 }] },

    // Floor 3 - Cupboard E2 (ledsPerDrawer: 6)
    { cupboardId: 9, row: 2, col: 4, ean: '9876543210987', label: 'Loratadine 10mg', queue: [{ user: 'User 2', color: 'red', count: 3 }, { user: 'User 3', color: 'yellow', count: 3 }] },
];

// ─── O(1) lookup maps (built once at module load) ────────────────────────────
const _drawerMap = new Map();
EAN_ASSIGNMENTS.forEach((a) => {
    _drawerMap.set(`${a.cupboardId}:${a.row}:${a.col}`, a);
});

const _cupboardMap = new Map();
EAN_ASSIGNMENTS.forEach((a) => {
    if (!_cupboardMap.has(a.cupboardId)) _cupboardMap.set(a.cupboardId, []);
    _cupboardMap.get(a.cupboardId).push(a);
});

const _ledColorMap = new Map(LED_COLORS.map((c) => [c.value, c]));

// ─── Helper: get assignment for a specific drawer ────────────────────────────
export function getDrawerAssignment(cupboardId, row, col) {
    return _drawerMap.get(`${cupboardId}:${row}:${col}`) || null;
}

// ─── Helper: get all assignments for a cupboard ───────────────────────────────
export function getCupboardAssignments(cupboardId) {
    return _cupboardMap.get(cupboardId) || [];
}

// ─── Helper: get LED color object by value ────────────────────────────────────
export function getLedColor(value) {
    return _ledColorMap.get(value) || LED_COLORS[0];
}
