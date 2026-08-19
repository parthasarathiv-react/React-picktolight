import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PharmacyScene } from './PharmacyScene';
import { createCinematicTimeline } from './TransferAnimation';

/**
 * PharmacyInventorySyncAnimation
 *
 * Self-contained 60 FPS Direct WebGL Ref 3D product visualization animation component.
 * Features Target Rack Center Stage Hero Finale animation upon API sync completion.
 *
 * Props:
 *  - syncPhase: 'locations' | 'racks' | 'bins' | 'complete'
 *  - onComplete: Callback function invoked after animation sequence finishes.
 */
export default function PharmacyInventorySyncAnimation({ syncPhase = 'idle', onComplete }) {
  const [scannerY, setScannerY] = useState(null);
  const [hudState, setHudState] = useState({
    statusText: "INITIALIZING AUTOMATED PHARMACY SYSTEM",
    currentBin: 0,
    totalBins: 0,
    isDone: false
  });

  const syncPhaseRef = useRef(syncPhase);
  useEffect(() => {
    syncPhaseRef.current = syncPhase;
  }, [syncPhase]);

  const sourceRackRef = useRef({});
  const targetRackRef = useRef({});
  const sourceBinRefs = useRef([]);
  const moverBinRefs = useRef([]);
  const targetBinRefs = useRef([]);

  // Initialize Master GSAP Cinematic Timeline on Mount
  useEffect(() => {
    let timeline;
    const timer = setTimeout(() => {
      timeline = createCinematicTimeline({
        sourceRackRefs: sourceRackRef.current,
        targetRackRefs: targetRackRef.current,
        sourceBinRefs,
        moverBinRefs,
        targetBinRefs,
        setScannerY,
        setHudState,
        getSyncPhase: () => syncPhaseRef.current,
        onCompleteCallback: () => {
          if (onComplete) {
            onComplete();
          }
        }
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      if (timeline) timeline.kill();
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at 50% 30%, #0d1527 0%, #050811 100%)',
        overflow: 'hidden',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        userSelect: 'none'
      }}
    >
      {/* High Performance 60 FPS 3D WebGL Canvas Layer */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.5, 11], fov: 48 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false
          }}
        >
          <PharmacyScene
            sourceRackRef={sourceRackRef}
            targetRackRef={targetRackRef}
            sourceBinRefs={sourceBinRefs}
            moverBinRefs={moverBinRefs}
            targetBinRefs={targetBinRefs}
            scannerY={scannerY}
            hudState={hudState}
          />
        </Canvas>
      </div>

      {/* Top Header Panel */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '32px',
          right: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: hudState.isDone ? '#10b981' : '#38bdf8',
              boxShadow: hudState.isDone
                ? '0 0 12px #10b981'
                : '0 0 12px #38bdf8'
            }}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              PHARMACY INVENTORY SYNC
            </h1>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '11px',
                color: '#64748b',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              AUTOMATED MIGRATION PROTOCOL v2.4
            </p>
          </div>
        </div>

        {/* Dynamic Item Counter Badge */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '8px',
            padding: '8px 16px',
            textAlign: 'right'
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: hudState.isDone ? '#34d399' : '#38bdf8',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {hudState.isDone
              ? `${hudState.currentBin} / ${hudState.totalBins} ITEMS`
              : `${hudState.currentBin} ITEMS MIGRATED`}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
            {hudState.isDone ? '100% SYNCHRONIZED' : 'MIGRATING DATABASE BINS...'}
          </div>
        </div>
      </div>

      {/* 🏆 HERO FINALE CENTER CARD (Appears when API Sync completes) */}
      {hudState.isDone && (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '2px solid #10b981',
            borderRadius: '20px',
            padding: '28px 40px',
            boxShadow: '0 0 60px rgba(16, 185, 129, 0.4), 0 25px 50px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
            zIndex: 20,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px auto',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: '#34d399',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.5)'
            }}
          >
            ✓
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            PHARMACY INVENTORY SYNCHRONIZED
          </h2>
          <p
            style={{
              margin: '8px 0 16px 0',
              fontSize: '13px',
              color: '#94a3b8',
              letterSpacing: '0.04em'
            }}
          >
            ALL BINS & TARGET RACK LOCATIONS SUCCESSFULLY VERIFIED
          </p>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              borderRadius: '20px',
              padding: '6px 18px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#34d399',
              letterSpacing: '0.06em'
            }}
          >
            {hudState.currentBin} BINS SYNCHRONIZED • 100% COMPLETE
          </div>
        </div>
      )}

      {/* Bottom Status & Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '460px',
          maxWidth: '90vw',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: hudState.isDone
            ? '1px solid rgba(16, 185, 129, 0.6)'
            : '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          pointerEvents: 'none',
          zIndex: 10,
          textAlign: 'center'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: hudState.isDone ? '#34d399' : '#e2e8f0',
            letterSpacing: '0.06em',
            marginBottom: '10px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {hudState.isDone && (
            <span style={{ fontSize: '14px', color: '#34d399' }}>✓</span>
          )}
          {hudState.statusText}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#1e293b',
            borderRadius: '3px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: hudState.isDone ? '100%' : '80%',
              height: '100%',
              backgroundColor: hudState.isDone ? '#10b981' : '#0284c7',
              boxShadow: hudState.isDone
                ? '0 0 10px #10b981'
                : '0 0 10px #0284c7',
              transition: 'all 0.4s ease-out'
            }}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '10px',
            color: '#64748b',
            fontWeight: 500
          }}
        >
          <span>SOURCE: DATABASE A</span>
          <span>TARGET: DATABASE B</span>
        </div>
      </div>
    </div>
  );
}
