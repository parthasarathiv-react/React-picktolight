import React, { useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Html } from '@react-three/drei';
import { Archive, Box as BoxIcon } from 'lucide-react';
import { CUPBOARDS_CONFIG, getDrawerAssignment, getLedColor } from 'lib/dataStore';
import { Card } from 'components/ui/card';

const FRAME = '#203250';
const FRAME_DARK = '#03132e';
const BORDER = '#5fa6ff';
const WALL = '#010a25';

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

function ShelfCell({ cupboardId, row, col, ledsPerDrawer, position, size }) {
    const [hovered, setHovered] = useState(false);
    const assignment = getDrawerAssignment(cupboardId, row, col);
    const cellId = `${row}${String.fromCharCode(64 + col)}`;

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
                <meshStandardMaterial color={hovered ? '#425679' : assignment ? '#203250' : '#03132e'} />
                <Edges threshold={12} color={assignment ? BORDER : '#234f7d'} opacity={assignment ? 0.35 : 0.18} transparent />
            </mesh>

            <Html position={[0, -size[1] * 0.18, size[2] / 2 + 0.02]} center transform distanceFactor={7}>
                <div className="text-[8px] text-white/60 font-mono select-none">{cellId}</div>
            </Html>

            {Array.from({ length: ledsPerDrawer }).map((_, ledIndex) => {
                const colorValue = activeLedsColors[ledIndex];
                const activeColorMeta = colorValue ? getLedColor(colorValue) : null;
                const isActive = !!activeColorMeta;
                const ledGap = size[0] / (ledsPerDrawer + 1);
                const x = -size[0] / 2 + ledGap * (ledIndex + 1);
                const ledColor = isActive ? activeColorMeta.hex : '#0e2e54';

                return (
                    <mesh key={ledIndex} position={[x, size[1] * 0.22, size[2] / 2 + 0.04]}>
                        <sphereGeometry args={[0.035, 12, 12]} />
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
    const rows = cupboard.shelves || cupboard.rows || 4;
    const cols = cupboard.columns || 3;
    const ledsPerDrawer = cupboard.ledsPerDrawer || 4;
    const width = Math.max(3.4, cols * 0.82);
    const shelfHeight = 0.42;
    const upperHeight = rows * shelfHeight;
    const height = upperHeight + 0.45;
    const depth = 0.72;
    const cellWidth = width / cols;
    const cellHeight = upperHeight / rows;

    return (
        <group ref={groupRef} position={position} onClick={onSelect}>
            <mesh position={[0, height / 2, -0.08]}>
                <boxGeometry args={[width + 0.18, height, depth + 0.18]} />
                <meshStandardMaterial color={isActive ? '#234f7d' : FRAME} transparent opacity={0.92} />
                <Edges threshold={10} color={isActive ? BORDER : '#234f7d'} />
            </mesh>

            <mesh position={[0, upperHeight + 0.18, depth / 2 + 0.02]}>
                <boxGeometry args={[width + 0.18, 0.22, 0.16]} />
                <meshStandardMaterial color={FRAME} />
            </mesh>

            <Html position={[0, height + 0.35, depth / 2]} center distanceFactor={8}>
                <div className="bg-ot-surface-top border border-ot-border text-white px-3 py-1 rounded text-xs font-bold shadow-lg whitespace-nowrap">
                    {cupboard.name}
                    <span className="text-ot-action ml-2">{rows} shelves</span>
                </div>
            </Html>

            {Array.from({ length: rows }).map((_, rowIndex) =>
                Array.from({ length: cols }).map((_, colIndex) => {
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
                const y = shelfIndex * cellHeight;
                return (
                    <mesh key={`shelf-${shelfIndex}`} position={[0, y, depth / 2 + 0.09]}>
                        <boxGeometry args={[width, 0.035, 0.22]} />
                        <meshStandardMaterial color={BORDER} transparent opacity={0.35} />
                    </mesh>
                );
            })}

            {Array.from({ length: cols + 1 }).map((_, colIndex) => {
                const x = -width / 2 + colIndex * cellWidth;
                return (
                    <mesh key={`upright-${colIndex}`} position={[x, upperHeight / 2, depth / 2 + 0.09]}>
                        <boxGeometry args={[0.035, upperHeight, 0.22]} />
                        <meshStandardMaterial color={BORDER} transparent opacity={0.28} />
                    </mesh>
                );
            })}

            <mesh position={[0, -0.12, 0]}>
                <boxGeometry args={[width + 0.35, 0.16, depth + 0.35]} />
                <meshStandardMaterial color={FRAME_DARK} />
            </mesh>
        </group>
    );
}

function WallScene({ cupboards, activeCupboardIdx, onSelectCupboard }) {
    const totalWidth = cupboards.reduce((sum, cupboard) => {
        const cols = cupboard.columns || 3;
        return sum + Math.max(3.4, cols * 0.82) + 0.18;
    }, 0);
    let cursor = -totalWidth / 2;
    const maxRows = cupboards.reduce((max, cupboard) => Math.max(max, cupboard.shelves || cupboard.rows || 4), 0);
    const wallHeight = Math.max(4.8, maxRows * 0.42 + 2.2);

    return (
        <>
            <mesh position={[0, wallHeight / 2 - 0.25, -0.36]}>
                <boxGeometry args={[Math.max(totalWidth + 0.8, 7), wallHeight, 0.12]} />
                <meshStandardMaterial color={WALL} />
                <Edges threshold={10} color="#234f7d" opacity={0.32} transparent />
            </mesh>

            {cupboards.map((cupboard, index) => {
                const width = Math.max(3.4, (cupboard.columns || 3) * 0.82);
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
                <ambientLight intensity={0.55} />
                <pointLight position={[3, 5, 6]} intensity={0.8} />
                <directionalLight position={[-5, 5, 5]} intensity={0.45} />

                <WallScene
                    cupboards={visibleCupboards}
                    activeCupboardIdx={activeCupboardIdx}
                    onSelectCupboard={onSelectCupboard}
                />

                <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    maxPolarAngle={Math.PI / 2 + 0.12}
                    minPolarAngle={Math.PI / 6}
                    minDistance={5}
                    maxDistance={18}
                    target={[0, 2, 0]}
                />
            </Canvas>
        </div>
    );
}
