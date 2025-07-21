import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene {
    // Sky background sprites
    private skyBackgroundCenter!: Phaser.GameObjects.TileSprite;
    private skyBackgroundLeft!: Phaser.GameObjects.TileSprite;
    private skyBackgroundRight!: Phaser.GameObjects.TileSprite;

    // Grass background sprites
    private grassBackgroundCenter!: Phaser.GameObjects.TileSprite;
    private grassBackgroundLeft!: Phaser.GameObjects.TileSprite;
    private grassBackgroundRight!: Phaser.GameObjects.TileSprite;

    private roadPath!: Phaser.GameObjects.Image;

    // Grass borders around the road
    private grassBorderTop!: Phaser.GameObjects.TileSprite;
    private grassBorderLeft!: Phaser.GameObjects.TileSprite;
    private grassBorderRight!: Phaser.GameObjects.TileSprite;
    private grassBorderBottom!: Phaser.GameObjects.TileSprite;

    private gate!: Phaser.GameObjects.Image;

    // Fence sprites
    private fenceLeft!: Phaser.GameObjects.TileSprite;
    private fenceRight!: Phaser.GameObjects.TileSprite;

    // Grass bottom borders under fences
    private grassBottomBorderLeft!: Phaser.GameObjects.TileSprite;
    private grassBottomBorderRight!: Phaser.GameObjects.TileSprite;

    private readonly MAIN_GAME_AREA_WIDTH: number = 1440;
    private mainGameAreaLeftBound: number = 0;
    private mainGameAreaRightBound: number = 0;

    constructor() {
        super('Game');
    }

    /**
     * Preload all game assets
     */
    preload() {
        this.load.setPath('assets');

        this.load.image('sky', 'sky.png');
        this.load.image('lane', 'lane.png');
        this.load.image('grass', 'grass.png');
        this.load.image('lane-grass-top', 'lane-grass-top.png');
        this.load.image('lane-grass-left', 'lane-grass-left.png');
        this.load.image('lane-grass-right', 'lane-grass-right.png');
        this.load.image('lane-grass-bottom', 'lane-grass-left-bottom.png');
        this.load.image('gate', 'gate.png');
        this.load.image('fence-left', 'fence-left.png');
        this.load.image('fence-right', 'fence-right.png');
        this.load.image('grass-left-bottom', 'grass-left-bottom.png');
        this.load.image('grass-right-bottom', 'grass-right-bottom.png');
    }

    /**
     * Initialize the game scene and create all game objects
     */
    create() {
        // Set scene background color
        this.cameras.main.setBackgroundColor('#E2C0A0');
        
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;

        // Calculate main game area boundaries (1440px centered area)
        this.mainGameAreaLeftBound = screenCenterX - this.MAIN_GAME_AREA_WIDTH / 2;
        this.mainGameAreaRightBound = screenCenterX + this.MAIN_GAME_AREA_WIDTH / 2;

        this.renderSkyBackground();
        this.renderGrassBackground();

        // Create road path centered in the game area
        // Road Y position = sky height (264) + grass height (279) = 543
        this.roadPath = this.add.image(screenCenterX, 543, 'lane');
        this.roadPath.setOrigin(0.5, 1);
        this.roadPath.setDisplaySize(823, 176);

        this.renderRoadGrassBorders();
        this.renderGate();
        this.renderGrassBottomBorders();

        this.scale.on('resize', this.handleScreenResize, this);

        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Render sky background with three-part tiling system (center + left/right extensions)
     * Handles responsive design for screens wider than main game area
     */
    private renderSkyBackground(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;
        const SKY_HEIGHT = 527; // Sky extends 2 rows (264 * 2 - 1) to avoid gaps

        if (this.skyBackgroundCenter) this.skyBackgroundCenter.destroy();
        if (this.skyBackgroundLeft) this.skyBackgroundLeft.destroy();
        if (this.skyBackgroundRight) this.skyBackgroundRight.destroy();

        // Render main sky background in the center game area
        this.skyBackgroundCenter = this.add.tileSprite(
            screenCenterX,
            0,
            this.MAIN_GAME_AREA_WIDTH,
            SKY_HEIGHT,
            'sky',
        );
        this.skyBackgroundCenter.setOrigin(0.5, 0);

        // Render left sky extension if screen is wider than game area
        if (this.mainGameAreaLeftBound > 0) {
            const leftExtensionWidth = this.mainGameAreaLeftBound;
            this.skyBackgroundLeft = this.add.tileSprite(
                leftExtensionWidth / 2,
                0,
                leftExtensionWidth,
                SKY_HEIGHT,
                'sky',
            );
            this.skyBackgroundLeft.setOrigin(0.5, 0);
        }

        // Render right sky extension if screen is wider than game area
        const rightExtensionWidth = screenWidth - this.mainGameAreaRightBound;
        if (rightExtensionWidth > 0) {
            this.skyBackgroundRight = this.add.tileSprite(
                this.mainGameAreaRightBound + rightExtensionWidth / 2,
                0,
                rightExtensionWidth,
                SKY_HEIGHT,
                'sky',
            );
            this.skyBackgroundRight.setOrigin(0.5, 0);
        }
    }

    /**
     * Render grass background with three-part tiling system (center + left/right extensions)
     * Positioned below sky background
     */
    private renderGrassBackground(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;
        const GRASS_Y_POSITION = 264; // Grass starts below sky
        const GRASS_HEIGHT = 279;

        if (this.grassBackgroundCenter) this.grassBackgroundCenter.destroy();
        if (this.grassBackgroundLeft) this.grassBackgroundLeft.destroy();
        if (this.grassBackgroundRight) this.grassBackgroundRight.destroy();

        // Render main grass background in the center game area
        this.grassBackgroundCenter = this.add.tileSprite(
            screenCenterX,
            GRASS_Y_POSITION,
            this.MAIN_GAME_AREA_WIDTH,
            GRASS_HEIGHT,
            'grass',
        );
        this.grassBackgroundCenter.setOrigin(0.5, 0);

        // Render left grass extension if screen is wider than game area
        if (this.mainGameAreaLeftBound > 0) {
            const leftExtensionWidth = this.mainGameAreaLeftBound;
            this.grassBackgroundLeft = this.add.tileSprite(
                leftExtensionWidth / 2,
                GRASS_Y_POSITION,
                leftExtensionWidth,
                GRASS_HEIGHT,
                'grass',
            );
            this.grassBackgroundLeft.setOrigin(0.5, 0);
        }

        // Render right grass extension if screen is wider than game area
        const rightExtensionWidth = screenWidth - this.mainGameAreaRightBound;
        if (rightExtensionWidth > 0) {
            this.grassBackgroundRight = this.add.tileSprite(
                this.mainGameAreaRightBound + rightExtensionWidth / 2,
                GRASS_Y_POSITION,
                rightExtensionWidth,
                GRASS_HEIGHT,
                'grass',
            );
            this.grassBackgroundRight.setOrigin(0.5, 0);
        }
    }

    /**
     * Render decorative grass borders around the road
     * Creates visual separation between road and grass areas
     */
    private renderRoadGrassBorders(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;
        const ROAD_WIDTH = 823;
        const ROAD_HEIGHT = 176;
        const roadLeftEdge = screenCenterX - ROAD_WIDTH / 2;
        const roadRightEdge = screenCenterX + ROAD_WIDTH / 2;
        const roadTopEdge = 543 - ROAD_HEIGHT; // Road bottom at 543, so top = 543 - 176 = 367

        if (this.grassBorderTop) this.grassBorderTop.destroy();
        if (this.grassBorderLeft) this.grassBorderLeft.destroy();
        if (this.grassBorderRight) this.grassBorderRight.destroy();
        if (this.grassBorderBottom) this.grassBorderBottom.destroy();

        // Top grass border - position 1px above road top to avoid gaps
        this.grassBorderTop = this.add.tileSprite(
            screenCenterX,
            roadTopEdge - 1,
            ROAD_WIDTH,
            12,
            'lane-grass-top',
        );
        this.grassBorderTop.setOrigin(0.5, 0);

        // Left grass border - height set to half of road height, top aligned with road
        this.grassBorderLeft = this.add.tileSprite(
            roadLeftEdge + 1,
            roadTopEdge,
            9,
            ROAD_HEIGHT / 2,
            'lane-grass-left',
        );
        this.grassBorderLeft.setOrigin(1, 0);

        // Right grass border - positioned 7px left from road right edge
        this.grassBorderRight = this.add.tileSprite(
            roadRightEdge - 7,
            roadTopEdge,
            7,
            ROAD_HEIGHT,
            'lane-grass-right',
        );
        this.grassBorderRight.setOrigin(0, 0);

        // Bottom grass border - positioned at middle of road
        this.grassBorderBottom = this.add.tileSprite(
            roadLeftEdge + 368 / 2,
            roadTopEdge + ROAD_HEIGHT / 2,
            368,
            10,
            'lane-grass-bottom',
        );
        this.grassBorderBottom.setOrigin(0.5, 0.5);
    }

    /**
     * Render gate and fence elements
     * Gate is positioned at road's bottom-right, fences extend to screen edges
     */
    private renderGate(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;
        const ROAD_WIDTH = 823;
        const roadRightEdge = screenCenterX + ROAD_WIDTH / 2;
        const roadBottomEdge = 543;

        if (this.gate) this.gate.destroy();
        if (this.fenceLeft) this.fenceLeft.destroy();
        if (this.fenceRight) this.fenceRight.destroy();

        // Gate positioned 20px to the right of road's right edge
        this.gate = this.add.image(roadRightEdge + 20, roadBottomEdge, 'gate');
        this.gate.setOrigin(1, 1);

        // Left fence tiled from gate's left edge to screen left edge
        const gateLeftEdge = this.gate.x - this.gate.width;
        const fenceWidth = gateLeftEdge;
        const fenceHeight = 75;
        const grassBottomEdge = 264 + 279; // Grass Y position + grass height = 543

        this.fenceLeft = this.add.tileSprite(
            gateLeftEdge / 2,
            grassBottomEdge,
            fenceWidth,
            fenceHeight,
            'fence-left',
        );
        this.fenceLeft.setOrigin(0.5, 1);

        // Right fence tiled from gate's right edge to screen right edge
        const gateRightEdge = this.gate.x;
        const fenceRightWidth = screenWidth - gateRightEdge;

        this.fenceRight = this.add.tileSprite(
            gateRightEdge + fenceRightWidth / 2,
            grassBottomEdge,
            fenceRightWidth,
            fenceHeight,
            'fence-right',
        );
        this.fenceRight.setOrigin(0.5, 1);
    }

    /**
     * Render grass bottom borders under the fence areas
     * Provides visual continuity between fences and grass
     */
    private renderGrassBottomBorders(): void {
        const screenWidth = this.scale.width;
        const ROAD_WIDTH = 823;
        const screenCenterX = screenWidth / 2;
        const roadRightEdge = screenCenterX + ROAD_WIDTH / 2;
        const grassBottomEdge = 264 + 279; // Grass Y position + grass height = 543
        const grassBottomHeight = 10;

        if (this.grassBottomBorderLeft) this.grassBottomBorderLeft.destroy();
        if (this.grassBottomBorderRight) this.grassBottomBorderRight.destroy();

        // Calculate fence areas based on gate position
        const gateRightEdge = roadRightEdge + 20;
        const gateLeftEdge = gateRightEdge - 487; // Gate width approximation
        const fenceLeftWidth = gateLeftEdge;
        const fenceRightWidth = screenWidth - gateRightEdge;

        // Left grass bottom border - tiled under left fence area
        this.grassBottomBorderLeft = this.add.tileSprite(
            gateLeftEdge / 2,
            grassBottomEdge,
            fenceLeftWidth,
            grassBottomHeight,
            'grass-left-bottom',
        );
        this.grassBottomBorderLeft.setOrigin(0.5, 1);

        // Right grass bottom border - tiled under right fence area
        this.grassBottomBorderRight = this.add.tileSprite(
            gateRightEdge + fenceRightWidth / 2,
            grassBottomEdge,
            fenceRightWidth,
            grassBottomHeight,
            'grass-right-bottom',
        );
        this.grassBottomBorderRight.setOrigin(0.5, 1);
    }

    /**
     * Handle screen resize events by recalculating positions and re-rendering all elements
     * Ensures proper scaling and positioning on window resize
     */
    private handleScreenResize(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;

        // Recalculate main game area boundaries for new screen size
        this.mainGameAreaLeftBound = screenCenterX - this.MAIN_GAME_AREA_WIDTH / 2;
        this.mainGameAreaRightBound = screenCenterX + this.MAIN_GAME_AREA_WIDTH / 2;

        this.renderSkyBackground();
        this.renderGrassBackground();

        // Reposition road path to stay centered
        this.roadPath.setPosition(screenCenterX, 543);
        this.roadPath.setDisplaySize(823, 176);

        this.renderRoadGrassBorders();
        this.renderGate();
        this.renderGrassBottomBorders();
    }

    /**
     * Get the boundaries of the main game area for game logic positioning
     * @returns Object containing left bound, right bound, and total width
     */
    public getMainGameAreaBounds(): { left: number; right: number; width: number } {
        return {
            left: this.mainGameAreaLeftBound,
            right: this.mainGameAreaRightBound,
            width: this.MAIN_GAME_AREA_WIDTH,
        };
    }
}