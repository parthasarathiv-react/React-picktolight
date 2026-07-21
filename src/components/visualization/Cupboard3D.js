import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Edges, Html } from '@react-three/drei';
import { Archive, Box as BoxIcon } from 'lucide-react';
import { CUPBOARDS_CONFIG, getDrawerAssignment, getLedColor } from 'lib/dataStore';
import { Card } from 'components/ui/card';

const FRAME = '#203250';
const FRAME_DARK = '#03132e';
const BORDER = '#5fa6ff';
const WALL = '#010a25';

function FlatText({ text, color = '#8ba3c4', fontSize = 72, maxPlaneWidth = 0.6, planeHeight = 0.08, position }) {
    const texture = React.useMemo(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = Math.max(60, ctx.measureText(text).width + 32);
        const textHeight = fontSize + 16;
        
        canvas.width = textWidth;
        canvas.height = textHeight;
        
        const ctx2 = canvas.getContext('2d');
        ctx2.font = `bold ${fontSize}px sans-serif`;
        ctx2.fillStyle = color;
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText(text, textWidth / 2, textHeight / 2);
        
        const tex = new THREE.CanvasTexture(canvas);
        return { tex, aspect: textWidth / textHeight };
    }, [text, color, fontSize]);

    const calculatedWidth = planeHeight * texture.aspect;
    const finalWidth = Math.min(calculatedWidth, maxPlaneWidth);

    return (
        <mesh position={position}>
            <planeGeometry args={[finalWidth, planeHeight]} />
            <meshBasicMaterial map={texture.tex} transparent depthWrite={false} />
        </mesh>
    );
}

function ResponsiveCamera() {
    const { camera, size } = useThree();
    React.useEffect(() => {
        if (size.width < 600) {
            camera.fov = 75;
        } else if (size.width < 1024) {
            camera.fov = 55;
        } else {
            camera.fov = 44;
        }
        camera.updateProjectionMatrix();
    }, [size, camera]);
    return null;
}

function CameraAnimator({ activeCupboardIdx, cupboards }) {
    const { camera } = useThree();
    const animationFrameCount = useRef(0);
    
    const totalWidth = cupboards.reduce((sum, cupboard) => {
        return sum + getCupboard3DSize(cupboard).width + 0.18;
    }, 0);
    
    const [targetPos] = useState(() => new THREE.Vector3(0, 2, 0));
    const [camPos] = useState(() => new THREE.Vector3(0, 3.2, 9.5));
    
    useEffect(() => {
        let cursor = -totalWidth / 2;
        for (let i = 0; i < cupboards.length; i++) {
            const size = getCupboard3DSize(cupboards[i]);
            if (i === activeCupboardIdx) {
                const x = cursor + size.width / 2;
                const y = size.height / 2;
                
                targetPos.set(x, y, 0);
                
                const distance = Math.max(6, size.width * 1.8);
                camPos.set(x, y + 0.8, distance);
                break;
            }
            cursor += size.width + 0.18;
        }
        // Trigger translation animation for 80 frames
        animationFrameCount.current = 80;
    }, [activeCupboardIdx, cupboards, totalWidth, targetPos, camPos]);
    
    useFrame((state) => {
        if (animationFrameCount.current > 0) {
            state.camera.position.lerp(camPos, 0.08);
            if (state.controls) {
                state.controls.target.lerp(targetPos, 0.08);
                state.controls.update();
            }
            animationFrameCount.current--;
        }
    });
    
    return null;
}

function getCupboard3DSize(cupboard) {
    const scale3D = 3.4 / 600; // Fixed scale factor for 2D -> 3D
    const hasCustomLayout = cupboard.shelfLayout && cupboard.shelfLayout.length > 0;
    let width, upperHeight, canvasWidth, canvasHeight;
    
    if (hasCustomLayout) {
        const maxShelfX = Math.max(0, ...cupboard.shelfLayout.map(s => Number(s.x) + Number(s.width || 560)));
        const maxShelfY = Math.max(0, ...cupboard.shelfLayout.map(s => Number(s.y) + Number(s.height || 48)));
        const maxStripX = cupboard.ledStrips ? Math.max(0, ...cupboard.ledStrips.map(s => Number(s.x) + Number(s.width))) : 0;
        const maxStripY = cupboard.ledStrips ? Math.max(0, ...cupboard.ledStrips.map(s => Number(s.y) + Number(s.height))) : 0;
        
        canvasWidth = Math.max(600, maxShelfX + 40, maxStripX + 40);
        canvasHeight = Math.max(500, maxShelfY + 40, maxStripY + 40);
        
        width = canvasWidth * scale3D;
        upperHeight = canvasHeight * scale3D;
    } else {
        const rows = cupboard.shelves || cupboard.rows || 4;
        const cols = cupboard.columns || 3;
        width = Math.max(3.4, cols * 0.82);
        upperHeight = rows * 0.42;
        canvasWidth = width / scale3D;
        canvasHeight = upperHeight / scale3D;
    }
    
    const height = upperHeight + 0.45;
    const depth = 0.72;
    return { width, height, upperHeight, depth, scale3D, canvasWidth, canvasHeight, hasCustomLayout };
}

function LedStrip3D({ strip, canvasWidth, canvasHeight, upperHeight, depth, scale3D }) {
    const stripWidth = strip.width * scale3D;
    const stripHeight = strip.height * scale3D;
    const x = (strip.x + strip.width / 2 - canvasWidth / 2) * scale3D;
    const y = upperHeight - (strip.y + strip.height / 2) * scale3D;
    const renderCount = Math.min(strip.ledCount || 30, 200);
    const ledGap = stripWidth / (renderCount + 1);

    return (
        <group position={[x, y, depth / 2 + 0.1]}>
            <mesh>
                <boxGeometry args={[stripWidth, stripHeight, 0.02]} />
                <meshStandardMaterial color="#eab308" transparent opacity={0.3} />
            </mesh>
            {Array.from({ length: renderCount }).map((_, i) => {
                const ledX = -stripWidth / 2 + ledGap * (i + 1);
                return (
                    <mesh key={i} position={[ledX, 0, 0.015]}>
                        <sphereGeometry args={[0.01, 8, 8]} />
                        <meshBasicMaterial color="#fef08a" />
                        {i % Math.ceil(renderCount / 10) === 0 && (
                            <pointLight color="#facc15" intensity={0.2} distance={0.5} />
                        )}
                    </mesh>
                );
            })}
        </group>
    );
}

function ShelfCell({ cupboardId, row, col, ledsPerDrawer, position, size, cellIdOverride }) {
    const [hovered, setHovered] = useState(false);
    const assignment = getDrawerAssignment(cupboardId, row, col);
    const cellId = cellIdOverride || `${row}${String.fromCharCode(64 + col)}`;

    const activeLedsColors = [];
    if (assignment) {
        if (assignment.queue) {
            assignment.queue.forEach(q => {
                for (let i = 0; i < q.count; i++) {
                    activeLedsColors.push(q.color);
                }
            });
        } else {
            const actCount = Math.min(assignment.activeLeds || 0, ledsPerDrawer);
            for (let i = 0; i < actCount; i++) {
                activeLedsColors.push(assignment.ledColor);
            }
        }
    }

    return (
        <group position={position}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={size} />
                <meshStandardMaterial color={hovered ? '#425679' : assignment ? '#203250' : '#03132e'} roughness={0.6} metalness={0.2} />
                <Edges threshold={12} color={assignment ? BORDER : '#234f7d'} opacity={assignment ? 0.35 : 0.18} transparent />
            </mesh>

            <FlatText
                text={cellId}
                color="#8ba3c4"
                position={[0, -size[1] * 0.22, size[2] / 2 + 0.021]}
                planeHeight={Math.min(0.08, size[1] * 0.35)}
                maxPlaneWidth={size[0] - 0.05}
            />

            {Array.from({ length: ledsPerDrawer }).map((_, ledIndex) => {
                const colorValue = activeLedsColors[ledIndex];
                const activeColorMeta = colorValue ? getLedColor(colorValue) : null;
                const isActive = !!activeColorMeta;
                const ledGap = size[0] / (ledsPerDrawer + 1);
                const x = -size[0] / 2 + ledGap * (ledIndex + 1);
                const ledColor = isActive ? activeColorMeta.hex : '#0e2e54';

                return (
                    <mesh key={ledIndex} position={[x, size[1] * 0.22, size[2] / 2 + 0.04]}>
                        <sphereGeometry args={[Math.min(0.035, ledGap*0.3), 12, 12]} />
                        <meshBasicMaterial color={ledColor} />
                        {isActive && <pointLight color={ledColor} intensity={0.35} distance={0.8} />}
                    </mesh>
                );
            })}
        </group>
    );
}

function CupboardModel({ cupboard, position, isActive, onSelect }) {
    const groupRef = useRef();
    
    const {
        width, height, upperHeight, depth, scale3D, canvasWidth, canvasHeight, hasCustomLayout
    } = getCupboard3DSize(cupboard);

    const rows = cupboard.shelves || cupboard.rows || 4;
    const cols = cupboard.columns || 3;
    const ledsPerDrawer = cupboard.ledsPerDrawer || 4;

    return (
        <group ref={groupRef} position={position} onClick={onSelect}>
            <mesh position={[0, height / 2, -0.08]}>
                <boxGeometry args={[width + 0.18, height, depth + 0.18]} />
                <meshStandardMaterial color={isActive ? '#234f7d' : FRAME} transparent opacity={0.92} roughness={0.4} metalness={0.5} />
                <Edges threshold={10} color={isActive ? BORDER : '#234f7d'} />
            </mesh>

            <mesh position={[0, upperHeight + 0.18, depth / 2 + 0.02]}>
                <boxGeometry args={[width + 0.18, 0.22, 0.16]} />
                <meshStandardMaterial color={FRAME} roughness={0.4} metalness={0.5} />
            </mesh>

            <Html position={[0, height + 0.35, depth / 2]} center distanceFactor={8}>
                <div className="bg-ot-surface-top border border-ot-border text-white px-3 py-1 rounded text-xs font-bold shadow-lg whitespace-nowrap">
                    {cupboard.name}
                    <span className="text-ot-action ml-2">
                        {hasCustomLayout ? cupboard.shelfLayout.length : rows} shelves
                    </span>
                </div>
            </Html>

            {hasCustomLayout ? (
                <>
                    {/* Custom Shelf Layout */}
                    {[...cupboard.shelfLayout].sort((a, b) => Number(a.y) - Number(b.y) || Number(a.x) - Number(b.x)).map((shelf, shelfIdx) => {
                        const maxBinX = shelf.bins && shelf.bins.length > 0 ? Math.max(0, ...shelf.bins.map(b => Number(b.x) + Number(b.width))) : 0;
                        const maxBinY = shelf.bins && shelf.bins.length > 0 ? Math.max(0, ...shelf.bins.map(b => Number(b.y) + Number(b.height))) : 0;
                        
                        const displayWidth = Number(shelf.width) || 560;
                        const displayHeight = Number(shelf.height) || 48;
                        
                        const scaleX = maxBinX > 0 && displayWidth > 0 ? Math.min(1, displayWidth / (maxBinX + 10)) : 1;
                        const scaleY = maxBinY > 0 && displayHeight > 0 ? Math.min(1, displayHeight / (maxBinY + 10)) : 1;
                        const binScale = Math.min(scaleX, scaleY);

                        const shelf3Dw = displayWidth * scale3D;
                        const shelf3Dh = displayHeight * scale3D;
                        const shelf3Dx = (Number(shelf.x) + displayWidth / 2 - canvasWidth / 2) * scale3D;
                        const shelf3Dy = upperHeight - (Number(shelf.y) + displayHeight / 2) * scale3D;

                        return (
                            <group key={shelf.id}>
                                {/* Shelf Outline/Frame */}
                                <mesh position={[shelf3Dx, shelf3Dy, depth / 2 + 0.09]}>
                                    <boxGeometry args={[shelf3Dw, shelf3Dh, 0.1]} />
                                    <meshStandardMaterial color={BORDER} transparent opacity={0.08} />
                                    <Edges threshold={10} color={BORDER} opacity={0.3} transparent />
                                </mesh>
                                
                                <mesh position={[shelf3Dx, shelf3Dy - shelf3Dh/2, depth / 2 + 0.09]}>
                                    <boxGeometry args={[shelf3Dw, 0.035, 0.22]} />
                                    <meshStandardMaterial color={BORDER} transparent opacity={0.35} />
                                </mesh>

                                {/* Shelf Label */}
                                <FlatText
                                    text={shelf.label.toUpperCase()}
                                    color="#64748b"
                                    position={[shelf3Dx - shelf3Dw/2 + 0.35, shelf3Dy + shelf3Dh/2 + 0.05, depth / 2 + 0.1]}
                                    planeHeight={0.065}
                                    maxPlaneWidth={1.2}
                                />

                                {/* Bins */}
                                {shelf.bins && shelf.bins.map((bin, binIdx) => {
                                    const binGlobalW = Number(bin.width) * binScale;
                                    const binGlobalH = Number(bin.height) * binScale;
                                    const binGlobalX = Number(shelf.x) + Number(bin.x) * binScale;
                                    const binGlobalY = Number(shelf.y) + Number(bin.y) * binScale;
                                    
                                    const bin3Dx = (binGlobalX + binGlobalW / 2 - canvasWidth / 2) * scale3D;
                                    const bin3Dy = upperHeight - (binGlobalY + binGlobalH / 2) * scale3D;
                                    
                                    const isCustom = bin.label && !bin.label.toLowerCase().startsWith('shelf');
                                    const cellId = isCustom ? (shelf.bins.length === 1 ? bin.label : `${bin.label}-${String.fromCharCode(64 + binIdx + 1)}`) : undefined;

                                    return (
                                        <ShelfCell
                                            key={bin.id}
                                            cupboardId={cupboard.id}
                                            row={shelfIdx + 1}
                                            col={binIdx + 1}
                                            ledsPerDrawer={shelf.ledsPerBin || ledsPerDrawer}
                                            position={[bin3Dx, bin3Dy, depth / 2 + 0.09]}
                                            size={[binGlobalW * scale3D, binGlobalH * scale3D, 0.18]}
                                            cellIdOverride={cellId}
                                        />
                                    );
                                })}
                            </group>
                        );
                    })}

                    {/* Render LED Strips */}
                    {cupboard.ledStrips && cupboard.ledStrips.map(strip => (
                        <LedStrip3D 
                            key={strip.id} 
                            strip={strip} 
                            canvasWidth={canvasWidth}
                            canvasHeight={canvasHeight}
                            upperHeight={upperHeight}
                            depth={depth}
                            scale3D={scale3D}
                        />
                    ))}
                </>
            ) : (
                <>
                    {/* Standard Grid Layout */}
                    {Array.from({ length: rows }).map((_, rowIndex) =>
                        Array.from({ length: cols }).map((_, colIndex) => {
                            const cellWidth = width / cols;
                            const cellHeight = upperHeight / rows;
                            const x = -width / 2 + cellWidth * colIndex + cellWidth / 2;
                            const y = upperHeight - cellHeight * rowIndex - cellHeight / 2;
                            return (
                                <ShelfCell
                                    key={`${rowIndex}-${colIndex}`}
                                    cupboardId={cupboard.id}
                                    row={rowIndex + 1}
                                    col={colIndex + 1}
                                    ledsPerDrawer={ledsPerDrawer}
                                    position={[x, y, depth / 2 + 0.08]}
                                    size={[cellWidth - 0.05, cellHeight - 0.04, 0.18]}
                                />
                            );
                        })
                    )}

                    {Array.from({ length: rows + 1 }).map((_, shelfIndex) => {
                        const cellHeight = upperHeight / rows;
                        const y = shelfIndex * cellHeight;
                        return (
                            <mesh key={`shelf-${shelfIndex}`} position={[0, y, depth / 2 + 0.09]}>
                                <boxGeometry args={[width, 0.035, 0.22]} />
                                <meshStandardMaterial color={BORDER} transparent opacity={0.35} />
                            </mesh>
                        );
                    })}

                    {Array.from({ length: cols + 1 }).map((_, colIndex) => {
                        const cellWidth = width / cols;
                        const x = -width / 2 + colIndex * cellWidth;
                        return (
                            <mesh key={`upright-${colIndex}`} position={[x, upperHeight / 2, depth / 2 + 0.09]}>
                                <boxGeometry args={[0.035, upperHeight, 0.22]} />
                                <meshStandardMaterial color={BORDER} transparent opacity={0.28} />
                            </mesh>
                        );
                    })}
                </>
            )}

            <mesh position={[0, -0.12, 0]}>
                <boxGeometry args={[width + 0.35, 0.16, depth + 0.35]} />
                <meshStandardMaterial color={FRAME_DARK} roughness={0.7} metalness={0.3} />
            </mesh>
        </group>
    );
}

function WallScene({ cupboards, activeCupboardIdx, onSelectCupboard }) {
    const totalWidth = cupboards.reduce((sum, cupboard) => {
        const { width } = getCupboard3DSize(cupboard);
        return sum + width + 0.18;
    }, 0);
    let cursor = -totalWidth / 2;
    const maxWallHeight = cupboards.reduce((max, cupboard) => {
        const { height } = getCupboard3DSize(cupboard);
        return Math.max(max, height + 1.2);
    }, 4.8);
    
    const wallHeight = maxWallHeight;

    return (
        <>
            <mesh position={[0, wallHeight / 2 - 0.25, -0.36]}>
                <boxGeometry args={[Math.max(totalWidth + 0.8, 7), wallHeight, 0.12]} />
                <meshStandardMaterial color={WALL} />
                <Edges threshold={10} color="#234f7d" opacity={0.32} transparent />
            </mesh>

            {cupboards.map((cupboard, index) => {
                const { width } = getCupboard3DSize(cupboard);
                const x = cursor + width / 2;
                cursor += width + 0.18;
                return (
                    <CupboardModel
                        key={cupboard.id}
                        cupboard={cupboard}
                        position={[x, 0, 0]}
                        isActive={index === activeCupboardIdx}
                        onSelect={() => onSelectCupboard?.(index)}
                    />
                );
            })}

            <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[Math.max(totalWidth + 1, 7.2), 0.12, 1.25]} />
                <meshStandardMaterial color={FRAME_DARK} />
            </mesh>
        </>
    );
}

export default function Cupboard3D({ cupboards, controllerName, selectedCupboard, activeCupboardIdx = 0, onSelectCupboard }) {
    const visibleCupboards = (cupboards?.length ? cupboards : CUPBOARDS_CONFIG).filter((cb) => cb.status !== 'Inactive');
    const wallNames = [...new Set(visibleCupboards.map((cupboard) => cupboard.wall || 'No Wall'))].join(', ');
    const totalShelves = visibleCupboards.reduce((sum, cupboard) => sum + (cupboard.shelves || cupboard.rows || 0), 0);
    const currentCupboard = selectedCupboard || visibleCupboards[activeCupboardIdx] || null;
    const currentWall = currentCupboard?.wall || wallNames || 'No Wall';
    const currentCupboardName = currentCupboard?.name || 'No cupboard selected';
    const controllerLabel = controllerName || 'No controller';

    return (
        <div className="w-full h-full overflow-hidden bg-gradient-to-b from-[#010a25] to-[#01112c] relative">
            <Card className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-ot-border bg-ot-bg-top/80 backdrop-blur px-3 py-2 shadow-lg">
                <Archive className="w-4 h-4 text-ot-action" />
                <div>
                    <div className="text-sm font-bold text-white leading-tight">{controllerLabel} · {currentCupboardName}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{currentWall} · {visibleCupboards.length} cupboards · {totalShelves} shelves</div>
                </div>
            </Card>
            <Card className="absolute bottom-3 right-3 z-10 rounded-lg border border-ot-border bg-ot-bg-top/80 backdrop-blur px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
                <BoxIcon className="w-3.5 h-3.5 text-ot-action" />
                Drag to rotate, scroll to zoom
            </Card>

            <Canvas camera={{ position: [0, 3.2, 9.5], fov: 44 }}>
                <ResponsiveCamera />
                <ambientLight intensity={0.25} />
                <pointLight position={[3, 5, 6]} intensity={0.4} />
                <directionalLight position={[-5, 5, 5]} intensity={0.3} />

                <WallScene
                    cupboards={visibleCupboards}
                    activeCupboardIdx={activeCupboardIdx}
                    onSelectCupboard={onSelectCupboard}
                />

                <CameraAnimator activeCupboardIdx={activeCupboardIdx} cupboards={visibleCupboards} />

                <OrbitControls
                    makeDefault
                    enablePan
                    enableZoom
                    enableRotate
                    maxPolarAngle={Math.PI / 2 + 0.12}
                    minPolarAngle={Math.PI / 6}
                    minDistance={1.5}
                    maxDistance={20}
                    target={[0, 2, 0]}
                />
            </Canvas>
        </div>
    );
}
