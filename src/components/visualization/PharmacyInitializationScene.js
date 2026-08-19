import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, Edges } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { cn } from 'lib/utils';
import { CheckCircle2, Activity } from 'lucide-react';

const COLORS = {
    bg: '#020617', // Very dark slate
    rackFrame: '#1e293b',
    rackShelf: '#334155',
    binBody: '#0f172a',
    binPlastic: '#38bdf8',
    conveyorBelt: '#111827',
    conveyorFrame: '#334155',
    conveyorRoller: '#475569',
    robotJoint: '#0ea5e9',
    scanner: '#38bdf8',
    medicineBox1: '#e2e8f0',
    medicineBox2: '#f8fafc',
};

// -----------------------------
// Mock Data & Coordinates
// -----------------------------

const INVENTORY_DATA = [
    { id: 'BIN-001', medicine: 'Amoxicillin 500mg', sourcePos: [0, 3], targetPos: [0, 3] },
    { id: 'BIN-002', medicine: 'Ibuprofen 400mg', sourcePos: [1, 2], targetPos: [1, 2] },
    { id: 'BIN-003', medicine: 'Omeprazole 20mg', sourcePos: [0, 1], targetPos: [0, 1] },
    { id: 'BIN-004', medicine: 'Metformin 500mg', sourcePos: [1, 0], targetPos: [1, 0] },
    { id: 'BIN-005', medicine: 'Amlodipine 5mg', sourcePos: [0, 2], targetPos: [1, 3] },
    { id: 'BIN-006', medicine: 'Lisinopril 10mg', sourcePos: [1, 1], targetPos: [0, 2] },
];

const RACK_X_SOURCE = -8;
const RACK_X_TARGET = 8;
const RACK_Z = -2;

const getSlotPosition = (rackX, col, row) => {
    // col: 0 or 1, row: 0 to 3
    return [rackX + (col === 0 ? -1 : 1), 0.5 + row * 1.5, RACK_Z];
};

// -----------------------------
// 3D Components (Procedural Fallbacks)
// -----------------------------

const PharmacyRack = ({ position, label }) => {
    // Note: Replace with useGLTF('/models/pharmacy-rack.glb') when available
    return (
        <group position={position}>
            {/* Main Frame */}
            <mesh position={[0, 3, 0]}>
                <boxGeometry args={[4.2, 6.2, 2.2]} />
                <meshStandardMaterial color={COLORS.rackFrame} metalness={0.8} roughness={0.2} transparent opacity={0.4} />
                <Edges color={COLORS.rackShelf} threshold={15} opacity={0.5} transparent />
            </mesh>
            
            {/* Shelves */}
            {[0, 1.5, 3, 4.5, 6].map((y, i) => (
                <mesh key={i} position={[0, y, 0]}>
                    <boxGeometry args={[4, 0.1, 2]} />
                    <meshStandardMaterial color={COLORS.rackShelf} metalness={0.5} roughness={0.5} />
                </mesh>
            ))}

            {/* Label Board */}
            <mesh position={[0, 6.4, 1]}>
                <boxGeometry args={[3, 0.4, 0.1]} />
                <meshStandardMaterial color={COLORS.rackFrame} metalness={0.6} />
                <Edges color={COLORS.scanner} opacity={0.3} />
            </mesh>
        </group>
    );
};

const ConveyorBelt = () => {
    // Note: Replace with useGLTF('/models/conveyor.glb') when available
    return (
        <group position={[0, -0.2, 1]}>
            {/* Main Track Frame */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[11, 0.2, 1.6]} />
                <meshStandardMaterial color={COLORS.conveyorFrame} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Belt */}
            <mesh position={[0, 0.61, 0]}>
                <boxGeometry args={[10.8, 0.05, 1.2]} />
                <meshStandardMaterial color={COLORS.conveyorBelt} roughness={0.9} />
            </mesh>
            {/* Rollers under the belt */}
            {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
                <mesh key={i} position={[x, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 1.4, 16]} />
                    <meshStandardMaterial color={COLORS.conveyorRoller} metalness={0.7} />
                </mesh>
            ))}
            {/* Legs */}
            <mesh position={[-4, 0.25, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.5]} />
                <meshStandardMaterial color={COLORS.conveyorFrame} />
            </mesh>
            <mesh position={[4, 0.25, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.5]} />
                <meshStandardMaterial color={COLORS.conveyorFrame} />
            </mesh>
        </group>
    );
};

const InventoryBin = React.forwardRef(({ initialPosition }, ref) => {
    // Note: Replace with useGLTF('/models/medicine-bin.glb') when available
    const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: COLORS.binPlastic,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.8,
        thickness: 0.5,
        transparent: true,
        opacity: 0.7
    }), []);

    return (
        <group ref={ref} position={initialPosition}>
            {/* Outer Plastic Box */}
            <RoundedBox args={[1.6, 1.0, 1.6]} radius={0.1} smoothness={4} position={[0, 0.5, 0]}>
                <primitive object={glassMaterial} attach="material" />
                <Edges color={COLORS.binPlastic} threshold={15} opacity={0.6} />
            </RoundedBox>
            
            {/* Base/Tray */}
            <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[1.5, 0.1, 1.5]} />
                <meshStandardMaterial color={COLORS.binBody} />
            </mesh>

            {/* Inner Medicine Boxes (Mocked contents) */}
            <mesh position={[-0.3, 0.3, 0]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[0.5, 0.4, 0.8]} />
                <meshStandardMaterial color={COLORS.medicineBox1} />
            </mesh>
            <mesh position={[0.4, 0.35, -0.2]} rotation={[0, -0.1, 0]}>
                <boxGeometry args={[0.4, 0.5, 0.6]} />
                <meshStandardMaterial color={COLORS.medicineBox2} />
            </mesh>
        </group>
    );
});

const ScannerBeam = React.forwardRef((props, ref) => {
    return (
        <group ref={ref} visible={false}>
            {/* Horizontal Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.0, 1.2, 32]} />
                <meshBasicMaterial color={COLORS.scanner} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Light Cylinder */}
            <mesh position={[0, -1, 0]}>
                <cylinderGeometry args={[1.2, 1.2, 2, 32, 1, true]} />
                <meshBasicMaterial color={COLORS.scanner} transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
});

// -----------------------------
// Scene & Animation Manager
// -----------------------------

const SceneManager = ({ onComplete, setTotalItems, setTransferredCount, setCurrentItem, setIsComplete }) => {
    const { camera } = useThree();
    
    // Refs for animating objects
    const binsRef = useRef([]);
    const scannerRef = useRef();
    const timelineRef = useRef();

    // Populate bin refs
    if (binsRef.current.length !== INVENTORY_DATA.length) {
        binsRef.current = Array(INVENTORY_DATA.length).fill().map((_, i) => binsRef.current[i] || React.createRef());
    }

    useEffect(() => {
        setTotalItems(INVENTORY_DATA.length);
        
        // Initial cinematic camera setup
        camera.position.set(-8, 5, 15);
        camera.lookAt(RACK_X_SOURCE, 3, 0);

        const tl = gsap.timeline({
            onComplete: () => {
                setIsComplete(true);
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 2500); // Wait a bit to show the success state
            }
        });
        timelineRef.current = tl;

        // Intro Camera Pan
        tl.to(camera.position, { x: -2, z: 16, duration: 2, ease: "power2.inOut" });

        // Loop over each item to transfer
        INVENTORY_DATA.forEach((item, index) => {
            const binGroup = binsRef.current[index].current;
            if (!binGroup) return;

            const sourcePos = getSlotPosition(RACK_X_SOURCE, item.sourcePos[0], item.sourcePos[1]);
            const targetPos = getSlotPosition(RACK_X_TARGET, item.targetPos[0], item.targetPos[1]);

            // Conveyor path (slightly in front of the racks)
            const conveyorEntry = [RACK_X_SOURCE + 3.5, 0.5, 1];
            const conveyorExit = [RACK_X_TARGET - 3.5, 0.5, 1];

            tl.call(() => {
                setCurrentItem(item);
                setTransferredCount(index);
            }, [], "+=0.2");

            // 1. Scanner highlight
            tl.set(scannerRef.current.position, { x: sourcePos[0], y: sourcePos[1] + 2, z: sourcePos[2] })
              .set(scannerRef.current, { visible: true })
              .to(scannerRef.current.position, { y: sourcePos[1] - 0.5, duration: 0.6, ease: "power1.inOut" })
              .set(scannerRef.current, { visible: false });

            // 2. Bin pulls out from rack to conveyor
            // Mocking mechanical movement out of rack
            tl.to(binGroup.position, { z: conveyorEntry[2], duration: 0.5, ease: "power2.inOut" })
              .to(binGroup.position, { x: conveyorEntry[0], y: conveyorEntry[1], duration: 0.8, ease: "power2.inOut" });

            // 3. Bin travels along conveyor (left -> right)
            tl.to(camera.position, { x: camera.position.x + 1.2, duration: 1.5, ease: "none" }, "<")
              .to(binGroup.position, { x: conveyorExit[0], duration: 1.5, ease: "none" });

            // 4. Bin moves from conveyor into target slot
            tl.to(binGroup.position, { x: targetPos[0], y: targetPos[1], duration: 0.8, ease: "power2.inOut" })
              .to(binGroup.position, { z: targetPos[2], duration: 0.5, ease: "power2.inOut" });

        });

        // 5. Final completion zoom out
        tl.call(() => {
            setTransferredCount(INVENTORY_DATA.length);
        })
        .to(camera.position, { x: 0, y: 6, z: 22, duration: 3, ease: "power3.inOut" });

        return () => {
            tl.kill();
        };
    }, [camera, onComplete, setCurrentItem, setIsComplete, setTotalItems, setTransferredCount]);

    return (
        <>
            <PharmacyRack position={[RACK_X_SOURCE, 0, RACK_Z]} label="SOURCE INVENTORY" />
            <PharmacyRack position={[RACK_X_TARGET, 0, RACK_Z]} label="TARGET INVENTORY" />
            <ConveyorBelt />
            <ScannerBeam ref={scannerRef} />

            {/* Inventory Bins */}
            {INVENTORY_DATA.map((item, i) => (
                <InventoryBin 
                    key={item.id} 
                    ref={binsRef.current[i]} 
                    initialPosition={getSlotPosition(RACK_X_SOURCE, item.sourcePos[0], item.sourcePos[1])} 
                />
            ))}
        </>
    );
};

// -----------------------------
// UI Overlay Component
// -----------------------------

const SyncUI = ({ totalItems, transferredCount, currentItem, isComplete }) => {
    const progress = totalItems > 0 ? (transferredCount / totalItems) * 100 : 0;
    
    return (
        <div className="absolute bottom-6 right-6 pointer-events-none flex flex-col items-end z-10">
            {isComplete ? (
                <div className="bg-emerald-950/80 backdrop-blur-xl border border-emerald-500/50 p-5 rounded-2xl flex items-center gap-4 shadow-[0_0_40px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase">Inventory Synchronized</h3>
                        <p className="text-xs text-emerald-400/80 uppercase tracking-widest mt-0.5">{totalItems} / {totalItems} Items Transferred</p>
                    </div>
                </div>
            ) : (
                <div className="bg-ot-surface-top/80 backdrop-blur-xl border border-ot-action/30 p-5 rounded-2xl flex flex-col gap-4 shadow-[0_0_40px_rgba(14,165,233,0.1)] min-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center border-b border-ot-border/50 pb-3">
                        <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
                            <Activity className="w-4 h-4 text-ot-action" />
                            Pharmacy Sync
                        </h3>
                        <span className="text-[10px] font-mono text-ot-action/80 bg-ot-action/10 px-2 py-1 rounded">
                            {transferredCount} / {totalItems} ITEMS
                        </span>
                    </div>

                    <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-mono uppercase">
                            <span>Status</span>
                            <span className="text-white">
                                {currentItem ? `Transferring ${currentItem.id}` : 'Initializing...'}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-ot-action to-cyan-400 rounded-full transition-all duration-300 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-[1px] animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// -----------------------------
// Main Export
// -----------------------------

export default function PharmacyInitializationScene({ onComplete, className = "w-full h-full relative bg-[#020617]" }) {
    const [totalItems, setTotalItems] = useState(0);
    const [transferredCount, setTransferredCount] = useState(0);
    const [currentItem, setCurrentItem] = useState(null);
    const [isComplete, setIsComplete] = useState(false);

    return (
        <div className={className}>
            <SyncUI 
                totalItems={totalItems}
                transferredCount={transferredCount}
                currentItem={currentItem}
                isComplete={isComplete}
            />
            <Canvas>
                <color attach="background" args={[COLORS.bg]} />
                <fog attach="fog" args={[COLORS.bg, 15, 35]} />
                
                {/* Cinematic Lighting */}
                <ambientLight intensity={0.3} color="#ffffff" />
                <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" castShadow />
                <directionalLight position={[-10, 10, -5]} intensity={0.5} color={COLORS.scanner} />
                <pointLight position={[0, 5, 2]} intensity={0.8} color={COLORS.robotJoint} />

                <SceneManager 
                    onComplete={onComplete} 
                    setTotalItems={setTotalItems}
                    setTransferredCount={setTransferredCount}
                    setCurrentItem={setCurrentItem}
                    setIsComplete={setIsComplete}
                />
            </Canvas>
        </div>
    );
}
