# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CKB Rocket is a Phaser 3 game project with React TypeScript integration. Currently, it's based on the Phaser React template and awaits implementation of actual rocket game mechanics and potential CKB/Nervos blockchain integration.

## Essential Commands

```bash
# Install dependencies (uses pnpm via corepack)
npm install

# Run development server (port 8080)
npm run dev

# Build for production
npm run build

# Development/build without analytics
npm run dev-nolog
npm run build-nolog
```

## Architecture & Key Components

### Technology Stack
- **Phaser 3.90.0** - Game engine
- **React 19.0.0** - UI framework  
- **TypeScript 5.7.2** - Type safety
- **Vite 6.3.1** - Build tooling

### Core Architecture

1. **React-Phaser Integration Pattern**
   - `PhaserGame.tsx` manages the Phaser instance lifecycle within React
   - Uses forward refs to expose game and scene references
   - EventBus pattern for React-Phaser communication

2. **Game Structure**
   - Scene-based architecture (src/game/scenes/)
   - Game configuration in src/game/main.ts
   - 1024x768 canvas resolution
   - WebGL renderer with Canvas fallback

3. **Event Communication**
   - `EventBus.ts` provides bidirectional communication between React components and Phaser scenes
   - Example: React buttons can trigger Phaser scene actions via events

### Project Structure

```
src/
├── game/               # Phaser game logic
│   ├── scenes/        # Game scenes
│   ├── EventBus.ts    # React-Phaser communication
│   └── main.ts        # Phaser configuration
├── App.tsx            # Main React component
├── PhaserGame.tsx     # React-Phaser bridge
└── main.tsx           # React entry point

public/
└── assets/            # Game assets (images, sprites)
```

## Development Guidelines

### Adding Game Scenes
New scenes should:
1. Extend `Phaser.Scene`
2. Be placed in `src/game/scenes/`
3. Be registered in the Phaser config in `src/game/main.ts`
4. Use EventBus for React communication when needed

### Asset Management
- Place game assets in `public/assets/`
- Load assets in scene's `preload()` method
- Assets are served from `/assets/` path

### React-Phaser Communication
```typescript
// From React to Phaser
EventBus.emit('event-name', data);

// From Phaser to React
EventBus.on('event-name', (data) => {
    // Handle in React
});
```

## Current State & Next Steps

**Current State:**
- Basic Phaser template with example scene
- No game mechanics implemented
- No blockchain integration

**Potential Implementation Areas:**
1. Rocket game mechanics in Game.ts scene
2. Additional game scenes (menu, levels, game over)
3. CKB/Nervos blockchain integration if required
4. Game-specific assets to replace template assets
5. Testing setup (currently none exists)

## Important Notes

- No test framework is currently configured
- The project name suggests CKB blockchain integration, but none exists yet
- Available unused assets (lane.png, path.png, sky.png) suggest a path-following game concept
- Vite config separates dev/prod builds with analytics control