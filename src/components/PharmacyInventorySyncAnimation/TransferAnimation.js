import gsap from 'gsap';
import * as THREE from 'three';
import { SYNC_CONFIG } from './animationConfig';

// -----------------------------------------------------------------
// ⚡ ZERO GARBAGE COLLECTION PRE-ALLOCATED SCRATCH VECTORS
// -----------------------------------------------------------------
const _p0 = new THREE.Vector3();
const _p1 = new THREE.Vector3();
const _p2 = new THREE.Vector3();
const _p3 = new THREE.Vector3();
const _p4 = new THREE.Vector3();
const _offset1 = new THREE.Vector3(0.6, 0.5, 1.4);
const _offset3 = new THREE.Vector3(-0.6, 0.4, 0.8);
const _defaultOut = new THREE.Vector3();

/**
 * Calculates slot world coordinates for a given bin index in a rack.
 */
export function getSlotWorldPosition(rackPos, index) {
  const row = Math.floor(index / SYNC_CONFIG.COLS);
  const col = index % SYNC_CONFIG.COLS;

  const yPositions = [1.0, 0.0, -1.0];
  const xPositions = [-1.35, -0.45, 0.45, 1.35];

  return new THREE.Vector3(
    rackPos[0] + xPositions[col],
    rackPos[1] + yPositions[row] + 0.05,
    rackPos[2] + 0.05
  );
}

/**
 * High-Performance 60 FPS Bezier trajectory interpolation.
 */
export function getTransferPathPoint(progress, pStart, pEnd, targetVec) {
  const out = targetVec || _defaultOut;
  _p0.copy(pStart);
  _p1.copy(pStart).add(_offset1);
  _p2.set(
    (pStart.x + pEnd.x) * 0.5,
    Math.max(pStart.y, pEnd.y) + 2.2,
    1.2
  );
  _p3.copy(pEnd).add(_offset3);
  _p4.copy(pEnd);

  if (progress <= 0.25) {
    const t = progress / 0.25;
    return out.lerpVectors(_p0, _p1, t);
  } else if (progress <= 0.75) {
    const t = (progress - 0.25) / 0.5;
    const invT = 1 - t;
    out.set(
      _p1.x * (invT * invT) + _p2.x * (2 * invT * t) + _p3.x * (t * t),
      _p1.y * (invT * invT) + _p2.y * (2 * invT * t) + _p3.y * (t * t),
      _p1.z * (invT * invT) + _p2.z * (2 * invT * t) + _p3.z * (t * t)
    );
    return out;
  } else {
    const t = (progress - 0.75) / 0.25;
    return out.lerpVectors(_p3, _p4, t);
  }
}

/**
 * Builds the Master GSAP Timeline with Hero Target Rack Finale Animation.
 */
export function createCinematicTimeline({
  sourceRackRefs,
  targetRackRefs,
  sourceBinRefs,
  moverBinRefs,
  targetBinRefs,
  setScannerY,
  setHudState,
  getSyncPhase,
  onCompleteCallback
}) {
  const masterTimeline = gsap.timeline();
  const binsPerShelf = SYNC_CONFIG.COLS; // 4 bins per shelf
  const numShelves = SYNC_CONFIG.ROWS;   // 3 shelf levels
  const totalBins = SYNC_CONFIG.TOTAL_BINS;

  // Initialize visibility of all WebGL bins
  masterTimeline.call(() => {
    for (let i = 0; i < totalBins; i++) {
      if (sourceBinRefs.current[i]) sourceBinRefs.current[i].visible = false;
      if (moverBinRefs.current[i]) moverBinRefs.current[i].visible = false;
      if (targetBinRefs.current[i]) targetBinRefs.current[i].visible = false;
    }
  });

  // Initial Anticipation
  masterTimeline.to({}, { duration: 0.2 });

  // 1. Source Rack Fly In
  if (sourceRackRefs.container) {
    masterTimeline.call(() => {
      setHudState({
        statusText: "CONNECTING TO PHARMACY DATABASE...",
        currentBin: 0,
        totalBins: 0,
        isDone: false
      });
    });

    const left = sourceRackRefs.leftSupport;
    const right = sourceRackRefs.rightSupport;
    const top = sourceRackRefs.topFrame;
    const bottom = sourceRackRefs.bottomFrame;
    const shelves = sourceRackRefs.shelves;

    if (left) gsap.set(left.position, { x: -14, y: 8, z: -5 });
    if (right) gsap.set(right.position, { x: -14, y: -6, z: -2 });
    if (top) gsap.set(top.position, { x: -18, y: 10, z: 2 });
    if (bottom) gsap.set(bottom.position, { x: -18, y: -10, z: 0 });
    shelves.forEach(s => { if (s) gsap.set(s.position, { x: -16, z: -4 }); });

    const rackTL = gsap.timeline();
    if (left) rackTL.to(left.position, { x: -SYNC_CONFIG.RACK_WIDTH / 2 + 0.12, y: 0, z: 0, duration: 0.65, ease: "power3.out" }, 0);
    if (right) rackTL.to(right.position, { x: SYNC_CONFIG.RACK_WIDTH / 2 - 0.12, y: 0, z: 0, duration: 0.65, ease: "power3.out" }, 0.05);
    if (top) rackTL.to(top.position, { x: 0, y: SYNC_CONFIG.RACK_HEIGHT / 2 - 0.15, z: 0, duration: 0.6, ease: "power2.out" }, 0.08);
    if (bottom) rackTL.to(bottom.position, { x: 0, y: -SYNC_CONFIG.RACK_HEIGHT / 2 + 0.15, z: 0, duration: 0.6, ease: "power2.out" }, 0.12);

    shelves.forEach((s, idx) => {
      const targetY = [1.0, 0.0, -1.0][idx];
      if (s) rackTL.to(s.position, { x: 0, y: targetY, z: 0, duration: 0.5, ease: "back.out(1.2)" }, 0.15 + idx * 0.05);
    });

    masterTimeline.add(rackTL);
  }

  // 2. Source Bins Fly In
  const binFlyTL = gsap.timeline();
  for (let i = 0; i < totalBins; i++) {
    const srcMesh = sourceBinRefs.current[i];
    const targetPos = getSlotWorldPosition(SYNC_CONFIG.SOURCE_RACK_POS, i);

    if (srcMesh) {
      const startX = -12 - Math.random() * 4;
      const startY = (Math.random() - 0.5) * 8;
      const startZ = (Math.random() - 0.5) * 6;

      srcMesh.position.set(startX, startY, startZ);
      srcMesh.visible = true;

      binFlyTL.to(srcMesh.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.45,
        ease: "power2.out"
      }, i * 0.04);
    }
  }
  masterTimeline.add(binFlyTL);

  // 3. Target Rack Fly In
  if (targetRackRefs.container) {
    masterTimeline.call(() => {
      setHudState({
        statusText: "INITIALIZING TARGET DATABASE RACK...",
        currentBin: 0,
        totalBins: 0,
        isDone: false
      });
    });

    const left = targetRackRefs.leftSupport;
    const right = targetRackRefs.rightSupport;
    const top = targetRackRefs.topFrame;
    const bottom = targetRackRefs.bottomFrame;
    const shelves = targetRackRefs.shelves;

    if (left) gsap.set(left.position, { x: 14, y: -6, z: -3 });
    if (right) gsap.set(right.position, { x: 16, y: 8, z: 2 });
    if (top) gsap.set(top.position, { x: 18, y: 10, z: 0 });
    if (bottom) gsap.set(bottom.position, { x: 16, y: -10, z: -2 });
    shelves.forEach(s => { if (s) gsap.set(s.position, { x: 15, z: 3 }); });

    const targetTL = gsap.timeline();
    if (left) targetTL.to(left.position, { x: -SYNC_CONFIG.RACK_WIDTH / 2 + 0.12, y: 0, z: 0, duration: 0.6, ease: "power3.out" }, 0);
    if (right) targetTL.to(right.position, { x: SYNC_CONFIG.RACK_WIDTH / 2 - 0.12, y: 0, z: 0, duration: 0.6, ease: "power3.out" }, 0.04);
    if (top) targetTL.to(top.position, { x: 0, y: SYNC_CONFIG.RACK_HEIGHT / 2 - 0.15, z: 0, duration: 0.55, ease: "power2.out" }, 0.08);
    if (bottom) targetTL.to(bottom.position, { x: 0, y: -SYNC_CONFIG.RACK_HEIGHT / 2 + 0.15, z: 0, duration: 0.55, ease: "power2.out" }, 0.12);

    shelves.forEach((s, idx) => {
      const targetY = [1.0, 0.0, -1.0][idx];
      if (s) targetTL.to(s.position, { x: 0, y: targetY, z: 0, duration: 0.45, ease: "back.out(1.2)" }, 0.14 + idx * 0.04);
    });

    masterTimeline.add(targetTL);
  }

  // 4. Smooth 60 FPS Direct WebGL Shelf Transfer Engine
  let currentShelfIndex = 0;
  let totalMigratedBins = 0;

  const runShelfTransferCycle = () => {
    const shelfTL = gsap.timeline();
    const startIndex = currentShelfIndex * binsPerShelf;
    const endIndex = startIndex + binsPerShelf;

    // Laser scan sweep on current shelf
    const shelfY = [1.0, 0.0, -1.0][currentShelfIndex];
    const scannerObj = { y: shelfY + 0.5 };

    shelfTL.to(scannerObj, {
      y: shelfY - 0.5,
      duration: 0.45,
      ease: "power1.inOut",
      onUpdate: () => {
        setScannerY(scannerObj.y);
      },
      onComplete: () => {
        setScannerY(null);
      }
    });

    // Animate 4 bins on current shelf transferring Left -> Right
    for (let i = startIndex; i < endIndex; i++) {
      const srcMesh = sourceBinRefs.current[i];
      const moverMesh = moverBinRefs.current[i];
      const tgtMesh = targetBinRefs.current[i];

      const pStart = getSlotWorldPosition(SYNC_CONFIG.SOURCE_RACK_POS, i);
      const pEnd = getSlotWorldPosition(SYNC_CONFIG.TARGET_RACK_POS, i);
      const staggerDelay = (i - startIndex) * 0.35;

      shelfTL.call(() => {
        if (srcMesh) srcMesh.visible = false;
        if (moverMesh) {
          moverMesh.position.copy(pStart);
          moverMesh.visible = true;
        }
        if (tgtMesh) tgtMesh.visible = false;

        totalMigratedBins += 1;
        setHudState({
          statusText: `MIGRATING SHELF ${currentShelfIndex + 1} BIN ${String(totalMigratedBins).padStart(3, '0')}...`,
          currentBin: totalMigratedBins,
          totalBins: 0,
          isDone: false
        });
      }, null, 0.45 + staggerDelay);

      const progressObj = { t: 0 };
      shelfTL.to(progressObj, {
        t: 1,
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => {
          if (moverMesh) {
            getTransferPathPoint(progressObj.t, pStart, pEnd, moverMesh.position);
            moverMesh.rotation.set(
              Math.sin(progressObj.t * Math.PI) * 0.12,
              Math.cos(progressObj.t * Math.PI) * 0.15,
              Math.sin(progressObj.t * Math.PI * 2) * 0.06
            );
          }
        },
        onComplete: () => {
          if (moverMesh) moverMesh.visible = false;
          if (tgtMesh) {
            tgtMesh.position.copy(pEnd);
            tgtMesh.visible = true;
          }
        }
      }, 0.45 + staggerDelay);
    }

    // After current shelf transfers:
    shelfTL.call(() => {
      currentShelfIndex = (currentShelfIndex + 1) % numShelves;

      if (currentShelfIndex === 0) {
        const isApiComplete = getSyncPhase() === 'complete';

        if (!isApiComplete) {
          setHudState({
            statusText: "STORING BINS TO TARGET DATABASE... PREPARING NEXT RACK",
            currentBin: totalMigratedBins,
            totalBins: 0,
            isDone: false
          });

          // Reset target rack bins for next loop batch
          for (let i = 0; i < totalBins; i++) {
            if (targetBinRefs.current[i]) targetBinRefs.current[i].visible = false;
            if (sourceBinRefs.current[i]) {
              const targetPos = getSlotWorldPosition(SYNC_CONFIG.SOURCE_RACK_POS, i);
              sourceBinRefs.current[i].position.copy(targetPos);
              sourceBinRefs.current[i].visible = true;
            }
          }

          runShelfTransferCycle();
        } else {
          // -------------------------------------------------------------
          // 🏆 GRAND FINALE: API COMPLETE! TARGET RACK MOVES TO CENTER FRONT!
          // -------------------------------------------------------------
          setHudState({
            statusText: "INVENTORY SYNCHRONIZED SUCCESSFULLY",
            currentBin: totalMigratedBins,
            totalBins: totalMigratedBins,
            isDone: true
          });

          const finaleTL = gsap.timeline({
            onComplete: () => {
              gsap.to({}, {
                duration: 1.8,
                onComplete: () => {
                  if (onCompleteCallback) onCompleteCallback();
                }
              });
            }
          });

          const sourceContainer = sourceRackRefs.container;
          const targetContainer = targetRackRefs.container;
          const heroTargetPos = [0, 0.1, 2.2];

          // 1. Move Source Rack back into background
          if (sourceContainer) {
            finaleTL.to(sourceContainer.position, {
              x: -9.5,
              z: -3,
              duration: 1.4,
              ease: "power2.inOut"
            }, 0);
          }

          // 2. Glide Target Rack smoothly to CENTER FRONT STAGE!
          if (targetContainer) {
            finaleTL.to(targetContainer.position, {
              x: heroTargetPos[0],
              y: heroTargetPos[1],
              z: heroTargetPos[2],
              duration: 1.5,
              ease: "power3.inOut"
            }, 0);

            // Dynamic tilt towards viewer
            finaleTL.to(targetContainer.rotation, {
              y: -0.15,
              duration: 1.5,
              ease: "power3.inOut"
            }, 0);
          }

          // 3. Move target bins along with Target Rack to center front
          for (let i = 0; i < totalBins; i++) {
            const tgtMesh = targetBinRefs.current[i];
            if (tgtMesh) {
              tgtMesh.visible = true;
              const slotPos = getSlotWorldPosition(heroTargetPos, i);

              finaleTL.to(tgtMesh.position, {
                x: slotPos.x,
                y: slotPos.y,
                z: slotPos.z,
                duration: 1.5,
                ease: "power3.inOut"
              }, 0);

              finaleTL.to(tgtMesh.rotation, {
                y: -0.15,
                duration: 1.5,
                ease: "power3.inOut"
              }, 0);
            }
          }
        }
      } else {
        runShelfTransferCycle();
      }
    });
  };

  masterTimeline.call(() => {
    runShelfTransferCycle();
  });

  return masterTimeline;
}
