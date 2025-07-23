import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import {
  ChainDataManager,
  ProcessedBlockData,
  ProcessedTransactionData,
} from '../managers/ChainDataManager';

export class ChainVisualizationScene extends Scene {
  private chainDataManager: ChainDataManager;
  private blockSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private transactionSprites: Map<string, Phaser.GameObjects.Arc> = new Map();
  private metricsText: Phaser.GameObjects.Text;
  private blockContainer: Phaser.GameObjects.Container;
  private transactionContainer: Phaser.GameObjects.Container;
  private isSceneReady: boolean = false;

  constructor() {
    super({ key: 'ChainVisualizationScene' });
  }

  /**
   * Creates the chain visualization scene with block and transaction displays
   */
  create(): void {
    console.log('ChainVisualizationScene create() called');

    if (!this.add) {
      console.error('Add factory not available in create()');
      return;
    }

    this.blockContainer = this.add.container(100, 100);
    this.transactionContainer = this.add.container(100, 300);

    this.metricsText = this.add.text(10, 10, 'Chain Metrics Loading...', {
      fontSize: '16px',
      color: '#ffffff',
    });

    this.add.text(100, 50, 'Recent Blocks', {
      fontSize: '18px',
      color: '#ffffff',
    });

    this.add.text(100, 250, 'Live Transactions', {
      fontSize: '18px',
      color: '#ffffff',
    });

    console.log('ChainVisualizationScene UI elements created successfully');

    this.chainDataManager = new ChainDataManager();
    this.setupEventListeners();

    this.isSceneReady = true;

    console.log('ChainVisualizationScene fully initialized');
  }

  /**
   * Sets up event listeners for blockchain data updates
   */
  private setupEventListeners(): void {
    EventBus.on('processed-block-data', this.handleNewBlock.bind(this));
    EventBus.on('processed-transaction-data', this.handleNewTransaction.bind(this));
    EventBus.on('chain-metrics-updated', this.updateMetrics.bind(this));
    EventBus.on('transaction-removed', this.removeTransaction.bind(this));
  }

  /**
   * Handles new block data and creates visual representation
   * @param blockData - Processed block data to display
   */
  private handleNewBlock(blockData: ProcessedBlockData): void {
    if (!this.isSceneReady || !this.add || !this.blockContainer) {
      console.warn('Scene not ready for block rendering:', blockData.hash, {
        isSceneReady: this.isSceneReady,
        hasAdd: !!this.add,
        hasBlockContainer: !!this.blockContainer,
      });
      return;
    }

    try {
      const blockSprite = this.add.rectangle(0, 0, 60, 40, 0x00ff00, 0.8);
      blockSprite.setStrokeStyle(2, 0xffffff);

      const blockText = this.add.text(0, 0, `#${blockData.number}`, {
        fontSize: '12px',
        color: '#000000',
      });
      blockText.setOrigin(0.5);

      const blockCount = this.blockContainer.length / 2;
      const xPos = blockCount * 70;

      blockSprite.x = xPos;
      blockText.x = xPos;

      this.blockContainer.add([blockSprite, blockText]);
      this.blockSprites.set(blockData.hash, blockSprite);

      if (this.blockContainer.length > 20) {
        const oldSprite = this.blockContainer.list[0];
        const oldText = this.blockContainer.list[1];
        this.blockContainer.remove([oldSprite, oldText]);
        oldSprite.destroy();
        oldText.destroy();
      }

      this.repositionBlocks();

      console.log(`New block #${blockData.number} with ${blockData.transactionCount} transactions`);
    } catch (error) {
      console.error('Error rendering block:', blockData.hash, error);
    }
  }

  /**
   * Handles new transaction data and creates visual representation
   * @param txData - Processed transaction data to display
   */
  private handleNewTransaction(txData: ProcessedTransactionData): void {
    if (!this.isSceneReady || !this.add || !this.transactionContainer || !this.tweens) {
      console.warn('Scene not ready for transaction rendering:', txData.hash, {
        isSceneReady: this.isSceneReady,
        hasAdd: !!this.add,
        hasTransactionContainer: !!this.transactionContainer,
        hasTweens: !!this.tweens,
      });
      return;
    }

    try {
      let color: number;
      switch (txData.status) {
        case 'PENDING':
          color = 0xffff00;
          break;
        case 'PROPOSED':
          color = 0xff8800;
          break;
        case 'CONFIRMED':
          color = 0x00ff00;
          break;
        default:
          color = 0xcccccc;
      }

      const txSprite = this.add.arc(0, 0, 15, 0, Math.PI * 2, false, color, 0.7);
      txSprite.setStrokeStyle(1, 0xffffff);

      const txCount = this.transactionContainer.length;
      const xPos = (txCount % 15) * 35;
      const yPos = Math.floor(txCount / 15) * 35;

      txSprite.x = xPos;
      txSprite.y = yPos;

      this.transactionContainer.add(txSprite);
      this.transactionSprites.set(txData.hash, txSprite);

      this.tweens.add({
        targets: txSprite,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        yoyo: true,
        ease: 'Power2',
      });

      if (this.transactionContainer.length > 150) {
        const oldTx = this.transactionContainer.list[0];
        this.transactionContainer.remove(oldTx);
        oldTx.destroy();
      }

      console.log(`New ${txData.status.toLowerCase()} transaction: ${txData.hash.slice(0, 10)}...`);
    } catch (error) {
      console.error('Error rendering transaction:', txData.hash, error);
    }
  }

  /**
   * Removes a transaction from the display
   * @param txHash - Hash of the transaction to remove
   */
  private removeTransaction(txHash: string): void {
    if (!this.transactionContainer || !this.transactionSprites) {
      return;
    }

    const sprite = this.transactionSprites.get(txHash);
    if (sprite) {
      this.transactionContainer.remove(sprite);
      sprite.destroy();
      this.transactionSprites.delete(txHash);
    }
  }

  /**
   * Repositions all blocks in the container after adding/removing blocks
   */
  private repositionBlocks(): void {
    if (!this.blockContainer) {
      return;
    }

    const objects = this.blockContainer.list;
    for (let i = 0; i < objects.length; i += 2) {
      const sprite = objects[i] as Phaser.GameObjects.Rectangle;
      const text = objects[i + 1] as Phaser.GameObjects.Text;
      const index = Math.floor(i / 2);
      const xPos = index * 70;

      sprite.x = xPos;
      text.x = xPos;
    }
  }

  /**
   * Updates the metrics display with chain statistics
   * @param metrics - Chain metrics object containing statistics
   */
  private updateMetrics(metrics: any): void {
    if (!this.metricsText || !metrics) {
      return;
    }

    try {
      const metricsInfo = [
        `Block Time: ${(metrics.averageBlockTime || 0).toFixed(1)}s`,
        `TX Throughput: ${(metrics.transactionThroughput || 0).toFixed(2)} tx/s`,
        `Pending TXs: ${metrics.pendingTxCount || 0}`,
        `Confirmation Time: ${(metrics.confirmationTime || 0).toFixed(0)}s`,
      ];

      this.metricsText.setText(metricsInfo.join('\n'));
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  /**
   * Cleans up resources when the scene is shut down
   */
  shutdown(): void {
    console.log('ChainVisualizationScene shutting down');

    this.isSceneReady = false;

    EventBus.off('processed-block-data', this.handleNewBlock.bind(this));
    EventBus.off('processed-transaction-data', this.handleNewTransaction.bind(this));
    EventBus.off('chain-metrics-updated', this.updateMetrics.bind(this));
    EventBus.off('transaction-removed', this.removeTransaction.bind(this));

    this.chainDataManager?.cleanup();
  }
}
