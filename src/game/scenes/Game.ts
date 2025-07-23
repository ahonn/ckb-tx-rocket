import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { CKBChainVizService, Block } from '../../services/CKBChainVizService';

export class Game extends Scene {
    private skyBackgroundCenter!: Phaser.GameObjects.TileSprite;
    private skyBackgroundLeft!: Phaser.GameObjects.TileSprite;
    private skyBackgroundRight!: Phaser.GameObjects.TileSprite;

    private grassBackgroundCenter!: Phaser.GameObjects.TileSprite;
    private grassBackgroundLeft!: Phaser.GameObjects.TileSprite;
    private grassBackgroundRight!: Phaser.GameObjects.TileSprite;

    private roadPath!: Phaser.GameObjects.Image;

    private grassBorderTop!: Phaser.GameObjects.TileSprite;
    private grassBorderLeft!: Phaser.GameObjects.TileSprite;
    private grassBorderRight!: Phaser.GameObjects.TileSprite;
    private grassBorderBottom!: Phaser.GameObjects.TileSprite;

    private gate!: Phaser.GameObjects.Image;

    private fenceLeft!: Phaser.GameObjects.TileSprite;
    private fenceRight!: Phaser.GameObjects.TileSprite;

    private grassBottomBorderLeft!: Phaser.GameObjects.TileSprite;
    private grassBottomBorderRight!: Phaser.GameObjects.TileSprite;

    private readonly MAIN_GAME_AREA_WIDTH: number = 1440;
    private mainGameAreaLeftBound: number = 0;
    private mainGameAreaRightBound: number = 0;

    private chainVizService: CKBChainVizService;
    private leftOverlayContainer!: Phaser.GameObjects.Container;
    private rightOverlayContainer!: Phaser.GameObjects.Container;
    private leftOverlayBackground!: Phaser.GameObjects.Rectangle;
    private rightOverlayBackground!: Phaser.GameObjects.Rectangle;
    private blockInfoText!: Phaser.GameObjects.Text;
    private metricsText!: Phaser.GameObjects.Text;
    private transactionInfoText!: Phaser.GameObjects.Text;
    private connectionStatusText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
        this.chainVizService = new CKBChainVizService();
    }

    /**
     * Preloads all game assets including backgrounds, roads, and UI elements
     */
    preload(): void {
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
     * Creates the game scene with backgrounds, road, and chain data overlays
     */
    create(): void {
        this.cameras.main.setBackgroundColor('#E2C0A0');
        
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;

        this.mainGameAreaLeftBound = screenCenterX - this.MAIN_GAME_AREA_WIDTH / 2;
        this.mainGameAreaRightBound = screenCenterX + this.MAIN_GAME_AREA_WIDTH / 2;

        this.renderSkyBackground();
        this.renderGrassBackground();

        this.roadPath = this.add.image(screenCenterX, 543, 'lane');
        this.roadPath.setOrigin(0.5, 1);
        this.roadPath.setDisplaySize(823, 176);

        this.renderRoadGrassBorders();
        this.renderGate();
        this.renderGrassBottomBorders();

        this.createChainDataOverlays();
        this.initializeChainConnection();

        this.scale.on('resize', this.handleScreenResize, this);

        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Renders tiled sky background with responsive extensions for wide screens
     */
    private renderSkyBackground(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;
        const SKY_HEIGHT = 527;

        if (this.skyBackgroundCenter) this.skyBackgroundCenter.destroy();
        if (this.skyBackgroundLeft) this.skyBackgroundLeft.destroy();
        if (this.skyBackgroundRight) this.skyBackgroundRight.destroy();

        this.skyBackgroundCenter = this.add.tileSprite(
            screenCenterX,
            0,
            this.MAIN_GAME_AREA_WIDTH,
            SKY_HEIGHT,
            'sky',
        );
        this.skyBackgroundCenter.setOrigin(0.5, 0);

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
     * Renders tiled grass background positioned below the sky
     */
    private renderGrassBackground(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;
        const GRASS_Y_POSITION = 264;
        const GRASS_HEIGHT = 279;

        if (this.grassBackgroundCenter) this.grassBackgroundCenter.destroy();
        if (this.grassBackgroundLeft) this.grassBackgroundLeft.destroy();
        if (this.grassBackgroundRight) this.grassBackgroundRight.destroy();

        this.grassBackgroundCenter = this.add.tileSprite(
            screenCenterX,
            GRASS_Y_POSITION,
            this.MAIN_GAME_AREA_WIDTH,
            GRASS_HEIGHT,
            'grass',
        );
        this.grassBackgroundCenter.setOrigin(0.5, 0);

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
     * Renders decorative grass borders around the road edges
     */
    private renderRoadGrassBorders(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;
        const ROAD_WIDTH = 823;
        const ROAD_HEIGHT = 176;
        const roadLeftEdge = screenCenterX - ROAD_WIDTH / 2;
        const roadRightEdge = screenCenterX + ROAD_WIDTH / 2;
        const roadTopEdge = 543 - ROAD_HEIGHT;

        if (this.grassBorderTop) this.grassBorderTop.destroy();
        if (this.grassBorderLeft) this.grassBorderLeft.destroy();
        if (this.grassBorderRight) this.grassBorderRight.destroy();
        if (this.grassBorderBottom) this.grassBorderBottom.destroy();

        this.grassBorderTop = this.add.tileSprite(
            screenCenterX,
            roadTopEdge - 1,
            ROAD_WIDTH,
            12,
            'lane-grass-top',
        );
        this.grassBorderTop.setOrigin(0.5, 0);

        this.grassBorderLeft = this.add.tileSprite(
            roadLeftEdge + 1,
            roadTopEdge,
            9,
            ROAD_HEIGHT / 2,
            'lane-grass-left',
        );
        this.grassBorderLeft.setOrigin(1, 0);

        this.grassBorderRight = this.add.tileSprite(
            roadRightEdge - 7,
            roadTopEdge,
            7,
            ROAD_HEIGHT,
            'lane-grass-right',
        );
        this.grassBorderRight.setOrigin(0, 0);

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
     * Renders the gate and fence elements around the game area
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

        this.gate = this.add.image(roadRightEdge + 20, roadBottomEdge, 'gate');
        this.gate.setOrigin(1, 1);

        const gateLeftEdge = this.gate.x - this.gate.width;
        const fenceWidth = gateLeftEdge;
        const fenceHeight = 75;
        const grassBottomEdge = 264 + 279;

        this.fenceLeft = this.add.tileSprite(
            gateLeftEdge / 2,
            grassBottomEdge,
            fenceWidth,
            fenceHeight,
            'fence-left',
        );
        this.fenceLeft.setOrigin(0.5, 1);

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
     * Renders grass borders under the fence areas
     */
    private renderGrassBottomBorders(): void {
        const screenWidth = this.scale.width;
        const ROAD_WIDTH = 823;
        const screenCenterX = screenWidth / 2;
        const roadRightEdge = screenCenterX + ROAD_WIDTH / 2;
        const grassBottomEdge = 264 + 279;
        const grassBottomHeight = 10;

        if (this.grassBottomBorderLeft) this.grassBottomBorderLeft.destroy();
        if (this.grassBottomBorderRight) this.grassBottomBorderRight.destroy();

        const gateRightEdge = roadRightEdge + 20;
        const gateLeftEdge = gateRightEdge - 487;
        const fenceLeftWidth = gateLeftEdge;
        const fenceRightWidth = screenWidth - gateRightEdge;

        this.grassBottomBorderLeft = this.add.tileSprite(
            gateLeftEdge / 2,
            grassBottomEdge,
            fenceLeftWidth,
            grassBottomHeight,
            'grass-left-bottom',
        );
        this.grassBottomBorderLeft.setOrigin(0.5, 1);

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
     * Handles screen resize events by re-rendering all game elements
     */
    private handleScreenResize(): void {
        const screenWidth = this.scale.width;
        const screenCenterX = screenWidth / 2;

        this.mainGameAreaLeftBound = screenCenterX - this.MAIN_GAME_AREA_WIDTH / 2;
        this.mainGameAreaRightBound = screenCenterX + this.MAIN_GAME_AREA_WIDTH / 2;

        this.renderSkyBackground();
        this.renderGrassBackground();

        this.roadPath.setPosition(screenCenterX, 543);
        this.roadPath.setDisplaySize(823, 176);

        this.renderRoadGrassBorders();
        this.renderGate();
        this.renderGrassBottomBorders();
        
        if (this.rightOverlayContainer) {
            const overlayWidth = 280;
            const padding = 20;
            this.rightOverlayContainer.x = screenWidth - overlayWidth - padding;
        }
    }

    /**
     * Gets the boundaries of the main game area
     * @returns Object containing left bound, right bound, and total width
     */
    public getMainGameAreaBounds(): { left: number; right: number; width: number } {
        return {
            left: this.mainGameAreaLeftBound,
            right: this.mainGameAreaRightBound,
            width: this.MAIN_GAME_AREA_WIDTH,
        };
    }

    /**
     * Creates semi-transparent overlays for displaying blockchain data
     */
    private createChainDataOverlays(): void {
        const overlayWidth = 280;
        const overlayHeight = 180;
        const padding = 20;
        const textStyle = {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'monospace',
            lineSpacing: 2,
        };

        this.leftOverlayContainer = this.add.container(padding, padding);
        
        this.leftOverlayBackground = this.add.rectangle(0, 0, overlayWidth, overlayHeight, 0x000000, 0.7);
        this.leftOverlayBackground.setOrigin(0, 0);
        this.leftOverlayBackground.setStrokeStyle(2, 0x00ff00, 0.8);
        
        this.blockInfoText = this.add.text(10, 10, 'Block: Loading...', textStyle);
        this.metricsText = this.add.text(10, 80, 'Metrics: Loading...', textStyle);
        
        this.leftOverlayContainer.add([this.leftOverlayBackground, this.blockInfoText, this.metricsText]);
        
        const screenWidth = this.scale.width;
        this.rightOverlayContainer = this.add.container(screenWidth - overlayWidth - padding, padding);
        
        this.rightOverlayBackground = this.add.rectangle(0, 0, overlayWidth, overlayHeight, 0x000000, 0.7);
        this.rightOverlayBackground.setOrigin(0, 0);
        this.rightOverlayBackground.setStrokeStyle(2, 0x00ff00, 0.8);
        
        this.transactionInfoText = this.add.text(10, 10, 'Transactions: Loading...', textStyle);
        
        this.connectionStatusText = this.add.text(10, 120, 'Status: Disconnected', {
            ...textStyle,
            fontSize: '12px',
            color: '#ff0000',
        });
        
        this.rightOverlayContainer.add([this.rightOverlayBackground, this.transactionInfoText, this.connectionStatusText]);
        
        this.leftOverlayContainer.setDepth(1000);
        this.rightOverlayContainer.setDepth(1000);
    }

    /**
     * Initializes connection to CKB ChainViz service and loads initial data
     */
    private async initializeChainConnection(): Promise<void> {
        try {
            await this.chainVizService.connect();
            
            this.connectionStatusText.setText('Status: Connected');
            this.connectionStatusText.setColor('#00ff00');
            
            this.chainVizService.subscribe('chain');
            this.chainVizService.subscribe('transactions');
            
            this.setupChainEventListeners();
            
            const snapshot = await this.chainVizService.getSnapshot();
            if (snapshot.latestBlock) {
                this.updateBlockInfo(snapshot.latestBlock);
            }
            if (snapshot.pendingTransactions) {
                this.updateTransactionInfo({
                    pending: snapshot.pendingTransactions.length,
                    proposed: snapshot.proposedTransactions?.length || 0,
                });
            }
        } catch (error) {
            console.error('Failed to connect to ChainViz service:', error);
            this.connectionStatusText.setText('Status: Connection Failed');
            this.connectionStatusText.setColor('#ff0000');
        }
    }

    /**
     * Sets up event listeners for real-time blockchain data updates
     */
    private setupChainEventListeners(): void {
        EventBus.on('block-finalized', (block: Block) => {
            this.updateBlockInfo(block);
        });

        let pendingCount = 0;
        let proposedCount = 0;
        let confirmedCount = 0;
        
        EventBus.on('transaction-pending', () => {
            pendingCount++;
            this.updateTransactionInfo({ pending: pendingCount, proposed: proposedCount, confirmed: confirmedCount });
        });
        
        EventBus.on('transaction-proposed', () => {
            if (pendingCount > 0) pendingCount--;
            proposedCount++;
            this.updateTransactionInfo({ pending: pendingCount, proposed: proposedCount, confirmed: confirmedCount });
        });
        
        EventBus.on('transaction-confirmed', () => {
            if (proposedCount > 0) proposedCount--;
            confirmedCount++;
            this.updateTransactionInfo({ pending: pendingCount, proposed: proposedCount, confirmed: confirmedCount });
            
            this.time.delayedCall(5000, () => {
                confirmedCount = 0;
                this.updateTransactionInfo({ pending: pendingCount, proposed: proposedCount, confirmed: confirmedCount });
            });
        });
        
        EventBus.on('chainviz-disconnected', () => {
            this.connectionStatusText.setText('Status: Disconnected');
            this.connectionStatusText.setColor('#ff0000');
        });
    }

    /**
     * Updates the block information display in the left overlay
     * @param block - Block data to display
     */
    private updateBlockInfo(block: Block): void {
        const blockTime = new Date(parseInt(block.timestamp)).toLocaleTimeString();
        const blockInfo = [
            `Block: #${block.blockNumber}`,
            `Hash: ${block.blockHash.slice(0, 14)}...`,
            `Time: ${blockTime}`,
            `Txs: ${block.transactionCount}`,
        ].join('\n');
        
        this.blockInfoText.setText(blockInfo);
        
        const metricsInfo = [
            `Miner: ${block.miner.slice(0, 14)}...`,
            `Reward: ${block.reward}`,
            `Proposals: ${block.proposalsCount || 0}`,
            `Uncles: ${block.unclesCount || 0}`,
        ].join('\n');
        
        this.metricsText.setText(metricsInfo);
        
        this.tweens.add({
            targets: this.leftOverlayBackground,
            alpha: 1,
            duration: 200,
            yoyo: true,
            ease: 'Power2',
        });
    }

    /**
     * Updates the transaction counts display in the right overlay
     * @param counts - Object containing pending, proposed, and confirmed transaction counts
     */
    private updateTransactionInfo(counts: { pending?: number; proposed?: number; confirmed?: number }): void {
        const txInfo = [
            'Transactions:',
            `  Pending: ${counts.pending || 0}`,
            `  Proposed: ${counts.proposed || 0}`,
            `  Confirmed: ${counts.confirmed || 0}`,
        ].join('\n');
        
        this.transactionInfoText.setText(txInfo);
        
        if (counts.confirmed && counts.confirmed > 0) {
            this.tweens.add({
                targets: this.rightOverlayBackground,
                alpha: 1,
                duration: 200,
                yoyo: true,
                ease: 'Power2',
            });
        }
    }

    /**
     * Cleans up resources when the scene is shut down
     */
    shutdown(): void {
        if (this.chainVizService.connected) {
            this.chainVizService.unsubscribe('chain');
            this.chainVizService.unsubscribe('transactions');
            this.chainVizService.disconnect();
        }
        
        EventBus.off('block-finalized');
        EventBus.off('transaction-pending');
        EventBus.off('transaction-proposed');
        EventBus.off('transaction-confirmed');
        EventBus.off('chainviz-disconnected');
    }
}