export const SYNC_CONFIG = {
  // Inventory settings
  TOTAL_BINS: 12,
  ROWS: 3,
  COLS: 4,

  // World Positions
  SOURCE_RACK_POS: [-5.2, -1.8, 0],
  TARGET_RACK_POS: [5.2, -1.8, 0],
  
  // Dimensions
  RACK_WIDTH: 4.6,
  RACK_HEIGHT: 4.8,
  RACK_DEPTH: 1.2,
  
  // Colors - Premium Dark Navy Theme & Medical accents
  COLORS: {
    navyBg: "#060a17",
    navyFog: "#080e22",
    rackFrame: "#1a233a",
    rackShelves: "#253352",
    rackAccents: "#3b82f6",
    scannerBeam: "#06b6d4",
    pathTrail: "#38bdf8",
    successGlow: "#10b981",
    
    // Realistic Bin Color Variants (Clean clinical palette)
    binBodies: ["#f8fafc", "#e2e8f0", "#f1f5f9", "#ffffff"],
    binLids: ["#0284c7", "#0d9488", "#3b82f6", "#475569"],
    binAccents: ["#38bdf8", "#2dd4bf", "#60a5fa", "#94a3b8"]
  },

  // Timings (in seconds)
  TIMINGS: {
    anticipation: 0.8,
    sourceRackAssemble: 1.6,
    sourceBinsFlyIn: 2.2,
    holdAndScan: 1.5,
    targetRackAssemble: 1.6,
    binTransferDuration: 1.1,
    binTransferStagger: 0.55,
    completionHold: 1.8
  }
};
