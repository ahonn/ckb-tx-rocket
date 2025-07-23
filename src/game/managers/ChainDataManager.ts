import { EventBus } from '../EventBus';
import { Block, EnhancedTransaction } from '../../services/CKBChainVizService';

export interface ProcessedBlockData {
  hash: string;
  number: number;
  timestamp: Date;
  transactionCount: number;
  totalValue: bigint;
  size: number;
  miner: string;
  difficulty: number;
}

export interface ProcessedTransactionData {
  hash: string;
  status: 'PENDING' | 'PROPOSED' | 'CONFIRMED' | 'REJECTED';
  value: bigint;
  fee: bigint;
  inputCount: number;
  outputCount: number;
  size: number;
  timestamp?: Date;
}

export interface ChainVisualizationData {
  blocks: ProcessedBlockData[];
  transactions: ProcessedTransactionData[];
  metrics: {
    averageBlockTime: number;
    transactionThroughput: number;
    networkHashRate: bigint;
    pendingTxCount: number;
    confirmationTime: number;
  };
}

export class ChainDataManager {
  private blocks: Map<string, ProcessedBlockData> = new Map();
  private transactions: Map<string, ProcessedTransactionData> = new Map();
  private blockTimestamps: number[] = [];
  private transactionCounts: number[] = [];

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for blockchain data updates
   */
  private setupEventListeners(): void {
    EventBus.on('block-finalized', this.handleNewBlock.bind(this));
    EventBus.on('transaction-pending', this.handleTransactionUpdate.bind(this));
    EventBus.on('transaction-proposed', this.handleTransactionUpdate.bind(this));
    EventBus.on('transaction-confirmed', this.handleTransactionUpdate.bind(this));
    EventBus.on('transaction-rejected', this.handleTransactionRejected.bind(this));
  }

  /**
   * Handles new block data and processes it for visualization
   * @param block - Raw block data from the service
   */
  private handleNewBlock(block: Block): void {
    try {
      console.log('Processing new block:', block.blockHash, 'with data:', block);

      const processedBlock = this.processBlock(block);
      this.blocks.set(block.blockHash, processedBlock);

      this.blockTimestamps.push(processedBlock.timestamp.getTime());
      if (this.blockTimestamps.length > 100) {
        this.blockTimestamps.shift();
      }

      this.transactionCounts.push(processedBlock.transactionCount);
      if (this.transactionCounts.length > 100) {
        this.transactionCounts.shift();
      }

      EventBus.emit('processed-block-data', processedBlock);
      EventBus.emit('chain-metrics-updated', this.getMetrics());

      console.log('Successfully processed block:', processedBlock.hash, processedBlock.number);
    } catch (error) {
      console.error('Error processing block:', block.blockHash, error);
      console.error('Block data:', block);
    }
  }

  /**
   * Handles transaction status updates and processes them for visualization
   * @param transaction - Enhanced transaction data from the service
   */
  private handleTransactionUpdate(transaction: EnhancedTransaction): void {
    try {
      const processedTx = this.processTransaction(transaction);
      this.transactions.set(transaction.txHash, processedTx);

      EventBus.emit('processed-transaction-data', processedTx);
    } catch (error) {
      console.error('Error processing transaction:', transaction.txHash, error);
      console.error('Transaction data:', transaction);
    }
  }

  /**
   * Handles rejected transactions by removing them from the transaction map
   * @param transaction - Enhanced transaction data from the service
   */
  private handleTransactionRejected(transaction: EnhancedTransaction): void {
    this.transactions.delete(transaction.txHash);
    EventBus.emit('transaction-removed', transaction.txHash);
  }

  /**
   * Processes raw block data into visualization-ready format
   * @param block - Raw block data from the service
   * @returns Processed block data for visualization
   */
  private processBlock(block: Block): ProcessedBlockData {
    return {
      hash: block.blockHash,
      number: parseInt(block.blockNumber),
      timestamp: new Date(block.timestamp),
      transactionCount: block.transactionCount,
      totalValue: BigInt(block.reward || '0'),
      size: 0,
      miner: block.miner,
      difficulty: 0,
    };
  }

  /**
   * Processes raw transaction data into visualization-ready format
   * @param transaction - Enhanced transaction data from the service
   * @returns Processed transaction data for visualization
   */
  private processTransaction(transaction: EnhancedTransaction): ProcessedTransactionData {
    return {
      hash: transaction.txHash,
      status: transaction.status,
      value: BigInt(0),
      fee: BigInt(0),
      inputCount: 0,
      outputCount: 0,
      size: 0,
      timestamp: new Date(transaction.timestamp),
    };
  }

  /**
   * Calculates and returns current network metrics
   * @returns Network metrics including block time, throughput, hash rate, and confirmation time
   */
  public getMetrics(): ChainVisualizationData['metrics'] {
    const avgBlockTime = this.calculateAverageBlockTime();
    const txThroughput = this.calculateTransactionThroughput();
    const pendingCount = Array.from(this.transactions.values()).filter(
      (tx) => tx.status === 'PENDING',
    ).length;

    return {
      averageBlockTime: avgBlockTime,
      transactionThroughput: txThroughput,
      networkHashRate: this.estimateHashRate(),
      pendingTxCount: pendingCount,
      confirmationTime: this.calculateAverageConfirmationTime(),
    };
  }

  /**
   * Calculates the average time between blocks in seconds
   * @returns Average block time in seconds, or 0 if insufficient data
   */
  private calculateAverageBlockTime(): number {
    if (this.blockTimestamps.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < this.blockTimestamps.length; i++) {
      intervals.push(this.blockTimestamps[i] - this.blockTimestamps[i - 1]);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length / 1000;
  }

  /**
   * Calculates transaction throughput in transactions per second
   * @returns Transaction throughput in TPS based on recent blocks
   */
  private calculateTransactionThroughput(): number {
    if (this.transactionCounts.length === 0) return 0;

    const recentCounts = this.transactionCounts.slice(-10);
    const totalTx = recentCounts.reduce((sum, count) => sum + count, 0);
    const avgBlockTime = this.calculateAverageBlockTime();

    return avgBlockTime > 0 ? totalTx / (recentCounts.length * avgBlockTime) : 0;
  }

  /**
   * Estimates network hash rate based on difficulty and block time
   * @returns Estimated hash rate in hashes per second
   */
  private estimateHashRate(): bigint {
    if (this.blocks.size === 0) return BigInt(0);

    const recentBlocks = Array.from(this.blocks.values()).slice(-10);
    const avgDifficulty =
      recentBlocks.reduce((sum, block) => sum + block.difficulty, 0) / recentBlocks.length;
    const avgBlockTime = this.calculateAverageBlockTime();

    return avgBlockTime > 0 ? BigInt(Math.floor(avgDifficulty / avgBlockTime)) : BigInt(0);
  }

  /**
   * Calculates average transaction confirmation time
   * @returns Average confirmation time in seconds (estimated as 6 block confirmations)
   */
  private calculateAverageConfirmationTime(): number {
    return this.calculateAverageBlockTime() * 6;
  }

  /**
   * Returns complete visualization data including blocks, transactions, and metrics
   * @returns Comprehensive chain visualization data
   */
  public getVisualizationData(): ChainVisualizationData {
    return {
      blocks: Array.from(this.blocks.values()).slice(-50),
      transactions: Array.from(this.transactions.values()).slice(-100),
      metrics: this.getMetrics(),
    };
  }

  /**
   * Retrieves the most recent blocks sorted by block number
   * @param count - Number of blocks to retrieve (default: 10)
   * @returns Array of recent blocks sorted by descending block number
   */
  public getRecentBlocks(count: number = 10): ProcessedBlockData[] {
    return Array.from(this.blocks.values())
      .sort((a, b) => b.number - a.number)
      .slice(0, count);
  }

  /**
   * Retrieves the most recent transactions sorted by timestamp
   * @param count - Number of transactions to retrieve (default: 20)
   * @returns Array of recent transactions sorted by descending timestamp
   */
  public getRecentTransactions(count: number = 20): ProcessedTransactionData[] {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.timestamp)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, count);
  }

  /**
   * Retrieves all currently pending transactions
   * @returns Array of transactions with PENDING status
   */
  public getPendingTransactions(): ProcessedTransactionData[] {
    return Array.from(this.transactions.values()).filter((tx) => tx.status === 'PENDING');
  }

  /**
   * Retrieves a specific block by its hash
   * @param hash - Block hash to search for
   * @returns Block data if found, undefined otherwise
   */
  public getBlockByHash(hash: string): ProcessedBlockData | undefined {
    return this.blocks.get(hash);
  }

  /**
   * Retrieves a specific transaction by its hash
   * @param hash - Transaction hash to search for
   * @returns Transaction data if found, undefined otherwise
   */
  public getTransactionByHash(hash: string): ProcessedTransactionData | undefined {
    return this.transactions.get(hash);
  }

  /**
   * Cleans up event listeners and resources
   * Should be called when the manager is no longer needed
   */
  public cleanup(): void {
    EventBus.off('block-finalized', this.handleNewBlock.bind(this));
    EventBus.off('transaction-pending', this.handleTransactionUpdate.bind(this));
    EventBus.off('transaction-proposed', this.handleTransactionUpdate.bind(this));
    EventBus.off('transaction-confirmed', this.handleTransactionUpdate.bind(this));
    EventBus.off('transaction-rejected', this.handleTransactionRejected.bind(this));
  }
}
