---
description: 3D / R3F usage rules — strict scoping
globs: frontend/features/landing/**
alwaysApply: false
---

# 3D / React Three Fiber Rules

## Where 3D is allowed

✅ **Landing page hero** — one scene
✅ **Marketing visuals** (about page, features showcase) — sparingly
✅ **Brand campaigns / launch microsites** — gated and time-bound

## Where 3D is NOT allowed

❌ Any dashboard (customer / partner / admin)
❌ Any list view, order detail, or transactional flow
❌ Any form
❌ Any background "ambient" effect across the app
❌ Modals, tooltips, popovers
❌ Mobile-critical paths (signup, checkout)

## Performance contract

Every 3D scene must:

1. **Lazy-load.** `dynamic(() => import('./scene'), { ssr: false })`.
2. **Viewport-gated.** Don't render outside viewport. Use `IntersectionObserver`.
3. **Pause off-screen.** `useFrame` guarded by `inView`.
4. **Reduced-motion fallback.** Replace with a static `<Image>` poster.
5. **Mobile fallback** if FPS drops < 50.
6. **Hard budget:**
   - 1 scene per page
   - ≤ 2 meshes
   - ≤ 60 KB total texture weight
   - Bundle delta < 120 KB (gz)
   - 60 FPS on mid-tier Android (Pixel 6a)

## Implementation template

```tsx
// features/landing/components/hero/index.tsx
'use client';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';
import { useReducedMotion } from 'framer-motion';
import { HeroPoster } from './hero-poster';

const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false });

export function Hero() {
  const reduce = useReducedMotion();
  const { ref, inView } = useInView({ threshold: 0.05 });

  return (
    <div ref={ref} className="relative h-[80vh] w-full" aria-label="Doorstep Laundry hero scene">
      {!reduce && inView ? <HeroScene /> : <HeroPoster />}
    </div>
  );
}
```

```tsx
// hero-scene.tsx
'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import { Suspense } from 'react';

function Bubble() {
  // Lightweight mesh: Float drei util
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.4}>
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2D7BFF" metalness={0.2} roughness={0.3} />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={1} />
        <Bubble />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
```

## Accessibility

- Provide a meaningful `aria-label` on the container.
- Provide a static fallback for reduced motion and screen readers.
- Don't trap focus inside a Canvas.
- Don't make 3D the only way to consume an information.

## Asset rules

- Use `gltfjsx` for any model imports; commit the generated typed component.
- Compress with `gltf-transform optimize`.
- Strip unused materials, animations, textures.
- No PBR with > 1k textures unless justified.

## What we don't do

❌ Heavy WebGL effects everywhere
❌ ASCII / shader playgrounds in dashboards
❌ Continuous postprocessing pipelines on landing
❌ Multiple R3F roots on a single page
❌ Decoding huge HDR environment maps for a single mesh

## Pre-merge for 3D PRs

- ✅ Bundle analyzer diff acceptable (< +120 KB gz)
- ✅ Lighthouse mobile still ≥ 90 on the landing
- ✅ FPS measured on mid-tier Android ≥ 55
- ✅ Static poster present
- ✅ Off-screen pause verified
- ✅ Reduced-motion path verified
