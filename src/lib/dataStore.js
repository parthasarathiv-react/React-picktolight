/**
 * dataStore.js
 * Single source of truth for static cupboard configuration and EAN assignments.
 * In a real system these would come from an API; here they live as module-level
 * mutable arrays so all pages share the same reference within a session.
 */

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
    { id: 1, name: 'Wall A', floor: 'Floor 1', cupboardsCount: 2, status: 'Active' },
    { id: 2, name: 'Wall B', floor: 'Floor 1', cupboardsCount: 1, status: 'Active' },
    { id: 3, name: 'Wall C', floor: 'Floor 2', cupboardsCount: 2, status: 'Active' },
    { id: 4, name: 'Wall D', floor: 'Floor 2', cupboardsCount: 2, status: 'Active' },
    { id: 5, name: 'Wall E', floor: 'Floor 3', cupboardsCount: 2, status: 'Active' },
];

// ─── Cupboard definitions (mirrors Settings.js cupboardsData) ────────────────
export const CUPBOARDS_CONFIG = [
    { id: 1, name: 'Cupboard A1', shelves: 5, rows: 5, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall A', status: 'Active' },
    { id: 2, name: 'Cupboard A2', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 6, controller: 'Controller A', wall: 'Wall A', status: 'Active' },
    { id: 3, name: 'Cupboard B1', shelves: 3, rows: 3, columns: 3, ledsPerDrawer: 4, controller: 'Controller B', wall: 'Wall B', status: 'Active' },
    { id: 4, name: 'Cupboard C1', shelves: 5, rows: 5, columns: 5, ledsPerDrawer: 6, controller: 'Controller C', wall: 'Wall C', status: 'Active' },
    { id: 5, name: 'Cupboard C2', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 5, controller: 'Controller C', wall: 'Wall C', status: 'Active' },
    { id: 6, name: 'Cupboard D1', shelves: 4, rows: 4, columns: 3, ledsPerDrawer: 5, controller: 'Controller D', wall: 'Wall D', status: 'Active' },
    { id: 7, name: 'Cupboard D2', shelves: 3, rows: 3, columns: 4, ledsPerDrawer: 4, controller: 'Controller D', wall: 'Wall D', status: 'Active' },
    { id: 8, name: 'Cupboard E1', shelves: 5, rows: 5, columns: 5, ledsPerDrawer: 6, controller: 'Controller E', wall: 'Wall E', status: 'Active' },
    { id: 9, name: 'Cupboard E2', shelves: 4, rows: 4, columns: 5, ledsPerDrawer: 6, controller: 'Controller E', wall: 'Wall E', status: 'Active' },
];

// ─── Hierarchical sample data: floor → controller → wall → cupboards ─────────
export const HIERARCHY_SAMPLE_DATA = [
    {
        id: 1,
        name: 'Floor 1',
        description: 'Main Pharmacy Floor',
        status: 'Active',
        controllers: [
            {
                id: 1,
                name: 'Controller A',
                ip: '192.168.1.101',
                port: '8080',
                status: 'Online',
                walls: [
                    {
                        id: 1,
                        name: 'Wall A',
                        status: 'Active',
                        cupboards: [
                            { id: 1, name: 'Cupboard A1', shelves: 5, rows: 5, columns: 4, ledsPerDrawer: 6, status: 'Active' },
                            { id: 2, name: 'Cupboard A2', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 6, status: 'Active' },
                        ],
                    },
                    {
                        id: 2,
                        name: 'Wall B',
                        status: 'Active',
                        cupboards: [
                            { id: 3, name: 'Cupboard B1', shelves: 3, rows: 3, columns: 3, ledsPerDrawer: 4, status: 'Active' },
                        ],
                    },
                ],
            },
            {
                id: 2,
                name: 'Controller B',
                ip: '192.168.1.102',
                port: '8080',
                status: 'Online',
                walls: [
                    {
                        id: 3,
                        name: 'Wall C',
                        status: 'Active',
                        cupboards: [
                            { id: 4, name: 'Cupboard B2', shelves: 4, rows: 4, columns: 3, ledsPerDrawer: 5, status: 'Active' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: 2,
        name: 'Floor 2',
        description: 'Bulk Storage Level',
        status: 'Active',
        controllers: [
            {
                id: 3,
                name: 'Controller C',
                ip: '192.168.1.103',
                port: '8080',
                status: 'Online',
                walls: [
                    {
                        id: 4,
                        name: 'Wall D',
                        status: 'Active',
                        cupboards: [
                            { id: 5, name: 'Cupboard C1', shelves: 5, rows: 5, columns: 5, ledsPerDrawer: 6, status: 'Active' },
                            { id: 6, name: 'Cupboard C2', shelves: 4, rows: 4, columns: 4, ledsPerDrawer: 5, status: 'Active' },
                        ],
                    },
                ],
            },
            {
                id: 4,
                name: 'Controller D',
                ip: '192.168.1.104',
                port: '8080',
                status: 'Online',
                walls: [
                    {
                        id: 5,
                        name: 'Wall E',
                        status: 'Active',
                        cupboards: [
                            { id: 7, name: 'Cupboard D1', shelves: 4, rows: 4, columns: 3, ledsPerDrawer: 5, status: 'Active' },
                            { id: 8, name: 'Cupboard D2', shelves: 3, rows: 3, columns: 4, ledsPerDrawer: 4, status: 'Active' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: 3,
        name: 'Floor 3',
        description: 'Dispatch / Loading Bay',
        status: 'Active',
        controllers: [
            {
                id: 5,
                name: 'Controller E',
                ip: '192.168.1.105',
                port: '8080',
                status: 'Online',
                walls: [
                    {
                        id: 6,
                        name: 'Wall F',
                        status: 'Active',
                        cupboards: [
                            { id: 9, name: 'Cupboard E1', shelves: 5, rows: 5, columns: 5, ledsPerDrawer: 6, status: 'Active' },
                            { id: 10, name: 'Cupboard E2', shelves: 4, rows: 4, columns: 5, ledsPerDrawer: 6, status: 'Active' },
                        ],
                    },
                ],
            },
        ],
    },
];

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
 *   ledColor   : string,   // one of LED_COLORS[].value
 *   activeLeds : number,   // how many LEDs to light up (1 … ledsPerDrawer)
 * }
 */
export const EAN_ASSIGNMENTS = [
    { cupboardId: 1, row: 1, col: 1, ean: '4006381333931', label: 'Aspirin 500mg', ledColor: 'green', activeLeds: 3 },
    { cupboardId: 1, row: 1, col: 2, ean: '5000157024626', label: 'Paracetamol 1g', ledColor: 'blue', activeLeds: 2 },
    { cupboardId: 1, row: 2, col: 3, ean: '3400936959728', label: 'Ibuprofen 400mg', ledColor: 'orange', activeLeds: 4 },
    { cupboardId: 1, row: 3, col: 1, ean: '7350022730018', label: 'Amoxicillin 250', ledColor: 'red', activeLeds: 6 },
    { cupboardId: 1, row: 5, col: 2, ean: '8710400101024', label: 'Omeprazole 20mg', ledColor: 'purple', activeLeds: 1 },
    { cupboardId: 2, row: 1, col: 1, ean: '5901030096809', label: 'Vitamin C 1000mg', ledColor: 'yellow', activeLeds: 3 },
    { cupboardId: 2, row: 2, col: 2, ean: '4007221031703', label: 'Zinc 10mg', ledColor: 'green', activeLeds: 2 },
    { cupboardId: 3, row: 1, col: 1, ean: '5000157065223', label: 'Metformin 500mg', ledColor: 'blue', activeLeds: 4 },
    { cupboardId: 3, row: 3, col: 2, ean: '3401560172004', label: 'Lisinopril 5mg', ledColor: 'red', activeLeds: 2 },
];

// ─── Helper: get assignment for a specific drawer ────────────────────────────
export function getDrawerAssignment(cupboardId, row, col) {
    return EAN_ASSIGNMENTS.find(
        (a) => a.cupboardId === cupboardId && a.row === row && a.col === col
    ) || null;
}

// ─── Helper: get all assignments for a cupboard ───────────────────────────────
export function getCupboardAssignments(cupboardId) {
    return EAN_ASSIGNMENTS.filter((a) => a.cupboardId === cupboardId);
}

// ─── Helper: get LED color object by value ────────────────────────────────────
export function getLedColor(value) {
    return LED_COLORS.find((c) => c.value === value) || LED_COLORS[0];
}
