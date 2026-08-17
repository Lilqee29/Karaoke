# GameBoy Boot Intro + GSAP App Reveal

**Date**: 2026-08-17  
**Status**: Approved  
**Scope**: Single implementation — intro animation system

## Goal
Replace the plain loading splash with a nostalgic GameBoy boot sequence animation using Lottie + GSAP, with retro sound effects.

## Sequence (3 phases, ~3.5s total)

### Phase 1: Boot (0–1.5s)
- Screen starts black
- Lottie animation: logo drops from top to center with bounce
- Retro "bing" chime sound (oscillator-based)
- Logo pulses once with glow

### Phase 2: Transition (1.5–2s)
- Logo fades/scales down
- CRT flicker effect (2-3 brightness frames)
- "Whoosh" transition sound

### Phase 3: App Reveal (2–3.5s)
- App icons start hidden (opacity:0, scale:0, y:20)
- GSAP stagger: each icon bounces in (0.05s stagger, elastic ease)
- Soft "pop" sound per icon
- Grid settles into final layout

## Technical Decisions
- **Lottie**: `@lottiefiles/lottie-player` CDN for logo animation
- **Lottie JSON**: Inline, minimal (~2KB) — simple vector logo drop
- **GSAP**: Already loaded, use Timeline for sequencing
- **Sounds**: Extend existing `playSound()` oscillator system
- **Session flag**: `sessionStorage` — intro plays once per tab session

## Files Modified
- `index.html` — add Lottie CDN, replace splash HTML
- `scripts/system.js` — add new sounds (introChime, introWhoosh, introPop)
- `scripts/app_upgrades.js` — add intro timeline + app reveal logic

## Testing
- Intro plays on fresh tab load
- Intro skipped on refresh (sessionStorage)
- Sounds play in correct sequence
- Apps are interactive immediately after reveal
- Works on mobile (touch-friendly, no layout shift)
