# SpiralGalaxy Component — Design Spec
**Date:** 2026-05-24  
**Status:** Approved (visual iteration via brainstorming session)

---

## Overview

A standalone animated spiral galaxy rendered on HTML5 Canvas 2D. Intended as a background visual for the AstroStat Academy site. Ships as an isolated component — NOT embedded in any layout until explicitly approved.

---

## Files to create

| File | Purpose |
|------|---------|
| `src/components/effects/SpiralGalaxy.tsx` | React canvas component |
| `src/pages/galaxy-test.astro` | Standalone test page (black bg, full-screen galaxy) |

---

## Physics

- **Rotation:** Clockwise (positive Δθ in canvas coords, where y-axis points down)
- **Rotation curve:** Flat (Rubin-style): `ω(r) = V_MAX / √(r² + R_CORE²)`
  - `V_MAX = 0.00014` rad/frame
  - `R_CORE = 0.13` (normalised radius)
  - Inner stars rotate faster; outer stars approach a constant speed
- **Spiral arms:** 2 logarithmic arms, 180° apart
  - Formula: `θ = −ln(r) / PITCH + arm × π`, `PITCH = 0.30`
  - Negative sign ensures arms trail correctly for CW rotation
- **Inclination:** 45° — disk y-axis compressed by `cos(45°) ≈ 0.707`
- **Depth shading:** particles on the near side (`sin(θ) > 0`) render brighter than the far side

---

## Particle populations

All radii are normalised to `[0, 1]` where 1 = galaxy radius.

| Type | Count (desktop) | Description |
|------|----------------|-------------|
| `bulge` | 400 | Warm yellow-orange stars, gaussian r~0.15 |
| `ob` | ~180 (13% of arm) | Hot blue-white OB stars, tight arm scatter σ=0.07 |
| `arm` | ~1020 (87% of arm) | Normal arm stars, wider scatter σ=0.14+r×0.18 |
| `hii` | 120 (60×2 arms) | Pink-red gas blobs, isGas=true, r∈[0.10,0.82] |
| `dust` | 80 (40×2 arms) | Dark brownish blobs offset +0.09 rad ahead of arm |
| `disk` | 3000 | Diffuse disk, exponential radial profile h=0.32, random azimuth |

**Total desktop:** ~4800 particles  
**Total mobile (`< 768px`):** ~1700 particles (quality multiplier `q = 0.35`)

---

## Rendering

- **Gas blobs** drawn first, sorted back-to-front by depth (`sin(θ)`)
- **Stars** drawn on top; bright stars (`sz > 1.0`) get a soft halo pass at 15% alpha
- **Bulge glow overlay:** warm radial gradient `rgba(255,225,150)` → transparent, toggled with bulge
- **Disk glow background:** faint blue ellipse gradient beneath all particles

---

## Toggleable layers

The component accepts an `enabled` prop to show/hide each population. State lives in the test page (`useState`); the component is purely controlled. For production use with no toggles needed, omit the prop (all layers default to `true`).

Layers: `bulge`, `ob`, `arm`, `hii`, `dust`, `disk`

---

## Component API

```tsx
<SpiralGalaxy
  enabled?: Partial<Record<'bulge'|'ob'|'arm'|'hii'|'dust'|'disk', boolean>>
  // defaults: all true
/>
```

The canvas fills its container (`width: 100%, height: 100%`). Parent controls size.

---

## Test page

`/galaxy-test` — standalone Astro page:
- Black background, `overflow: hidden`
- Full-viewport `SpiralGalaxy` with `client:load`
- Toggle buttons rendered below canvas
- **Not linked from any nav or layout**

---

## Constraints

- No backend, no CSS framework other than Tailwind (test page uses inline styles only)
- No client-side routing
- Canvas 2D only (no WebGL)
- Component must be deletable without touching any other file
