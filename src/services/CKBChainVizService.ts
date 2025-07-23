import { io, Socket } from 'socket.io-client';
import { EventBus } from '../game/EventBus';
import { chainVizConfig } from '../config/chainviz.config';

export interface Block {
    blockNumber: string;
    blockHash: string;
    timestamp: string;
    miner: string;
    reward: string;
    transactionCount: number;
    proposalsCount?: number;
    unclesCount?: number;
    transactions: Array<{
        txHash: string;
    }>;
}

export interface Transaction {
    txHash: string;
    timestamp: string;
    context?: {
        blockNumber?: string;
        blockHash?: string;
        txIndexInBlock?: number;
    };
}

export interface EnhancedTransaction extends Transaction {
    status: 'PENDING' | 'PROPOSED' | 'CONFIRMED' | 'REJECTED';
}

export interface Snapshot {
    latestBlock?: Block;
    pendingTransactions?: EnhancedTransaction[];
    proposedTransactions?: EnhancedTransaction[];
}

export interface WebSocketMessage {
    channel: 'chain' | 'transactions';
    type:
    | 'block.finalized'
    | 'transaction.pending'
    | 'transaction.proposed'
    | 'transaction.confirmed'
    | 'transaction.rejected';
    payload: Block | Transaction;
}

export interface ClientMessage {
    action: 'subscribe' | 'unsubscribe';
    channel: 'chain' | 'transactions';
}

export class CKBChainVizService {
    private socket: Socket | null = null;
    private baseUrl: string;
    private timeout: number;
    private isConnected: boolean = false;

    /**
     * Creates a new CKB ChainViz service instance
     * @param baseUrl - Optional custom base URL
     * @param timeout - Optional custom timeout
     */
    constructor(baseUrl?: string, timeout?: number) {
        this.baseUrl = baseUrl || chainVizConfig.url;
        this.timeout = timeout || chainVizConfig.timeout;
        
        console.log(`CKB ChainViz Service initialized with URL: ${this.baseUrl}`);
    }

    /**
     * Connects to the CKB ChainViz WebSocket service
     * @returns Promise that resolves when connected
     */
    async connect(): Promise<void> {
        if (this.socket) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.socket = io(this.baseUrl, {
                transports: ['websocket', 'polling'],
                timeout: this.timeout,
            });

            this.socket.on('connect', () => {
                console.log('Connected to CKB ChainViz service');
                this.isConnected = true;
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from CKB ChainViz service');
                this.isConnected = false;
                EventBus.emit('chainviz-disconnected');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.socket.on('message', (data: WebSocketMessage) => {
                this.handleMessage(data);
            });
        });
    }

    /**
     * Disconnects from the CKB ChainViz service
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Subscribes to a specific data channel
     * @param channel - Channel to subscribe to ('chain' or 'transactions')
     */
    subscribe(channel: 'chain' | 'transactions'): void {
        if (!this.socket || !this.isConnected) {
            console.warn('Socket not connected. Cannot subscribe to channel:', channel);
            return;
        }

        const message: ClientMessage = {
            action: 'subscribe',
            channel,
        };

        this.socket.emit('message', message);
        console.log(`Subscribed to channel: ${channel}`);
    }

    /**
     * Unsubscribes from a specific data channel
     * @param channel - Channel to unsubscribe from ('chain' or 'transactions')
     */
    unsubscribe(channel: 'chain' | 'transactions'): void {
        if (!this.socket || !this.isConnected) {
            console.warn('Socket not connected. Cannot unsubscribe from channel:', channel);
            return;
        }

        const message: ClientMessage = {
            action: 'unsubscribe',
            channel,
        };

        this.socket.emit('message', message);
        console.log(`Unsubscribed from channel: ${channel}`);
    }

    /**
     * Handles incoming WebSocket messages and emits appropriate events
     * @param data - WebSocket message data
     */
    private handleMessage(data: WebSocketMessage): void {
        const { channel, type, payload } = data;

        console.log(`Received ${type} event on ${channel} channel:`, payload);

        try {
            switch (type) {
                case 'block.finalized':
                    EventBus.emit('block-finalized', payload as Block);
                    break;
                case 'transaction.pending':
                    const pendingTx = {
                        ...(payload as Transaction),
                        status: 'PENDING' as const
                    };
                    EventBus.emit('transaction-pending', pendingTx);
                    break;
                case 'transaction.proposed':
                    const proposedTx = {
                        ...(payload as Transaction),
                        status: 'PROPOSED' as const
                    };
                    EventBus.emit('transaction-proposed', proposedTx);
                    break;
                case 'transaction.confirmed':
                    const confirmedTx = {
                        ...(payload as Transaction),
                        status: 'CONFIRMED' as const
                    };
                    EventBus.emit('transaction-confirmed', confirmedTx);
                    break;
                case 'transaction.rejected':
                    const rejectedTx = {
                        ...(payload as Transaction),
                        status: 'REJECTED' as const
                    };
                    EventBus.emit('transaction-rejected', rejectedTx);
                    break;
                default:
                    console.warn('Unknown message type:', type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            console.error('Message data:', data);
        }
    }

    /**
     * Fetches current blockchain snapshot
     * @returns Promise containing snapshot data
     */
    async getSnapshot(): Promise<Snapshot> {
        const response = await fetch(`${this.baseUrl}/api/v1/snapshot`);
        if (!response.ok) {
            throw new Error(`Failed to fetch snapshot: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Fetches the latest block from the blockchain
     * @returns Promise containing the latest block data
     */
    async getLatestBlock(): Promise<Block> {
        const response = await fetch(`${this.baseUrl}/api/v1/blocks/latest`);
        if (!response.ok) {
            throw new Error(`Failed to fetch latest block: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Fetches a specific block by block number
     * @param blockNumber - Block number to fetch
     * @returns Promise containing the block data
     */
    async getBlock(blockNumber: string): Promise<Block> {
        const response = await fetch(`${this.baseUrl}/api/v1/blocks/${blockNumber}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch block ${blockNumber}: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Fetches a specific transaction by hash
     * @param txHash - Transaction hash to fetch
     * @returns Promise containing the transaction data
     */
    async getTransaction(txHash: string): Promise<Transaction> {
        const response = await fetch(`${this.baseUrl}/api/v1/transactions/${txHash}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch transaction ${txHash}: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Gets the current connection status
     * @returns True if connected to the service
     */
    get connected(): boolean {
        return this.isConnected;
    }
}

/**
 * Default CKB ChainViz service instance
 */
export const chainVizService = new CKBChainVizService();
