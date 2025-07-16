import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene
{
    private skyCenterTileSprite!: Phaser.GameObjects.TileSprite;
    private skyLeftTileSprite!: Phaser.GameObjects.TileSprite;
    private skyRightTileSprite!: Phaser.GameObjects.TileSprite;
    private grassCenterTileSprite!: Phaser.GameObjects.TileSprite;
    private grassLeftTileSprite!: Phaser.GameObjects.TileSprite;
    private grassRightTileSprite!: Phaser.GameObjects.TileSprite;
    private path!: Phaser.GameObjects.Image;
    private gameAreaWidth: number = 1440;
    private gameAreaLeft: number = 0;
    private gameAreaRight: number = 0;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('sky', 'sky.png');
        this.load.image('lane', 'lane.png');
        this.load.image('path', 'path.png');
    }

    create ()
    {
        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;
        
        // Calculate game area boundaries
        this.gameAreaLeft = centerX - (this.gameAreaWidth / 2);
        this.gameAreaRight = centerX + (this.gameAreaWidth / 2);
        
        // Render sky and grass using dedicated functions
        this.renderSky();
        this.renderGrass();
        
        // Create path - centered in the game area
        // Grass bottom = 264 (sky height) + 279 (grass height) = 543
        this.path = this.add.image(centerX, 543, 'path');
        this.path.setOrigin(0.5, 1);  // Set origin to bottom center
        this.path.setDisplaySize(823, 176);
        
        // Listen for window resize events
        this.scale.on('resize', this.updateLayout, this);
        
        EventBus.emit('current-scene-ready', this);
    }

    private renderSky(): void
    {
        const width = this.scale.width;
        const centerX = width / 2;
        
        // Clear existing sky sprites
        if (this.skyCenterTileSprite) this.skyCenterTileSprite.destroy();
        if (this.skyLeftTileSprite) this.skyLeftTileSprite.destroy();
        if (this.skyRightTileSprite) this.skyRightTileSprite.destroy();
        
        // Create center sky tile sprite - render one complete tile in the center game area
        this.skyCenterTileSprite = this.add.tileSprite(centerX, 0, this.gameAreaWidth, 527, 'sky');
        this.skyCenterTileSprite.setOrigin(0.5, 0);
        
        // Create left sky extension if needed
        if (this.gameAreaLeft > 0) {
            this.skyLeftTileSprite = this.add.tileSprite(this.gameAreaLeft / 2, 0, this.gameAreaLeft, 527, 'sky');
            this.skyLeftTileSprite.setOrigin(0.5, 0);
        }
        
        // Create right sky extension if needed
        const rightWidth = width - this.gameAreaRight;
        if (rightWidth > 0) {
            this.skyRightTileSprite = this.add.tileSprite(this.gameAreaRight + (rightWidth / 2), 0, rightWidth, 527, 'sky');
            this.skyRightTileSprite.setOrigin(0.5, 0);
        }
    }
    
    private renderGrass(): void
    {
        const width = this.scale.width;
        const centerX = width / 2;
        
        // Clear existing grass sprites
        if (this.grassCenterTileSprite) this.grassCenterTileSprite.destroy();
        if (this.grassLeftTileSprite) this.grassLeftTileSprite.destroy();
        if (this.grassRightTileSprite) this.grassRightTileSprite.destroy();
        
        // Create center grass tile sprite - render one complete tile in the center game area
        this.grassCenterTileSprite = this.add.tileSprite(centerX, 264, this.gameAreaWidth, 279, 'lane');
        this.grassCenterTileSprite.setOrigin(0.5, 0);
        
        // Create left grass extension if needed
        if (this.gameAreaLeft > 0) {
            this.grassLeftTileSprite = this.add.tileSprite(this.gameAreaLeft / 2, 264, this.gameAreaLeft, 279, 'lane');
            this.grassLeftTileSprite.setOrigin(0.5, 0);
        }
        
        // Create right grass extension if needed
        const rightWidth = width - this.gameAreaRight;
        if (rightWidth > 0) {
            this.grassRightTileSprite = this.add.tileSprite(this.gameAreaRight + (rightWidth / 2), 264, rightWidth, 279, 'lane');
            this.grassRightTileSprite.setOrigin(0.5, 0);
        }
    }

    private updateLayout(): void
    {
        const width = this.scale.width;
        const centerX = width / 2;
        
        // Update game area boundaries
        this.gameAreaLeft = centerX - (this.gameAreaWidth / 2);
        this.gameAreaRight = centerX + (this.gameAreaWidth / 2);
        
        // Re-render sky and grass with new dimensions
        this.renderSky();
        this.renderGrass();
        
        // Update path - keep centered
        // Grass bottom = 264 (sky height) + 279 (grass height) = 543
        this.path.setPosition(centerX, 543);
        this.path.setDisplaySize(823, 176);
    }
    
    // Get game area boundaries for game logic
    public getGameAreaBounds(): { left: number, right: number, width: number } {
        return {
            left: this.gameAreaLeft,
            right: this.gameAreaRight,
            width: this.gameAreaWidth
        };
    }
}
