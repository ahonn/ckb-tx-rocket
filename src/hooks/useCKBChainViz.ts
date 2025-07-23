import { useState, useEffect, useCallback } from 'react';
import { EventBus } from '../game/EventBus';
import { chainVizService, Block, EnhancedTransaction } from '../services/CKBChainVizService';

export interface CKBChainVizState {
  isConnected: boolean;
  latestBlock: Block | null;
  pendingTransactions: EnhancedTransaction[];
  proposedTransactions: EnhancedTransaction[];
  recentBlocks: Block[];
  recentTransactions: EnhancedTransaction[];
  error: string | null;
}

/**
 * React hook for managing CKB ChainViz service connection and data
 * @returns Object containing connection state, data, and control functions
 */
export function useCKBChainViz() {
  const [state, setState] = useState<CKBChainVizState>({
    isConnected: false,
    latestBlock: null,
    pendingTransactions: [],
    proposedTransactions: [],
    recentBlocks: [],
    recentTransactions: [],
    error: null,
  });

  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Updates the state with partial updates
   * @param updates - Partial state updates to apply
   */
  const updateState = useCallback((updates: Partial<CKBChainVizState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Connects to the CKB ChainViz service and loads initial data
   */
  const connect = useCallback(async () => {
    if (isConnecting || state.isConnected) {
      return;
    }

    setIsConnecting(true);
    updateState({ error: null });

    try {
      await chainVizService.connect();

      chainVizService.subscribe('chain');
      chainVizService.subscribe('transactions');

      const snapshot = await chainVizService.getSnapshot();

      updateState({
        isConnected: true,
        latestBlock: snapshot?.latestBlock || null,
        pendingTransactions: snapshot?.pendingTransactions || [],
        proposedTransactions: snapshot?.proposedTransactions || [],
        recentBlocks: snapshot?.latestBlock ? [snapshot.latestBlock] : [],
      });
    } catch (error) {
      console.error('Failed to connect to CKB ChainViz:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Connection failed',
        isConnected: false,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, state.isConnected, updateState]);

  /**
   * Disconnects from the CKB ChainViz service and resets state
   */
  const disconnect = useCallback(() => {
    chainVizService.disconnect();
    updateState({
      isConnected: false,
      latestBlock: null,
      pendingTransactions: [],
      proposedTransactions: [],
      recentBlocks: [],
      recentTransactions: [],
    });
  }, [updateState]);

  useEffect(() => {
    const handleDisconnected = () => {
      updateState({ isConnected: false });
    };

    const handleBlockFinalized = (block: Block) => {
      updateState({
        latestBlock: block,
        recentBlocks: [block, ...(state.recentBlocks || []).slice(0, 9)],
      });
    };

    const handleTransactionPending = (transaction: EnhancedTransaction) => {
      updateState({
        pendingTransactions: [transaction, ...(state.pendingTransactions || []).slice(0, 99)],
        recentTransactions: [transaction, ...(state.recentTransactions || []).slice(0, 49)],
      });
    };

    const handleTransactionProposed = (transaction: EnhancedTransaction) => {
      updateState({
        pendingTransactions: (state.pendingTransactions || []).filter(
          (tx: EnhancedTransaction) => tx.txHash !== transaction.txHash,
        ),
        proposedTransactions: [transaction, ...(state.proposedTransactions || []).slice(0, 99)],
        recentTransactions: [transaction, ...(state.recentTransactions || []).slice(0, 49)],
      });
    };

    const handleTransactionConfirmed = (transaction: EnhancedTransaction) => {
      updateState({
        pendingTransactions: (state.pendingTransactions || []).filter(
          (tx: EnhancedTransaction) => tx.txHash !== transaction.txHash,
        ),
        proposedTransactions: (state.proposedTransactions || []).filter(
          (tx: EnhancedTransaction) => tx.txHash !== transaction.txHash,
        ),
        recentTransactions: [transaction, ...(state.recentTransactions || []).slice(0, 49)],
      });
    };

    const handleTransactionRejected = (transaction: EnhancedTransaction) => {
      updateState({
        pendingTransactions: (state.pendingTransactions || []).filter(
          (tx: EnhancedTransaction) => tx.txHash !== transaction.txHash,
        ),
        proposedTransactions: (state.proposedTransactions || []).filter(
          (tx: EnhancedTransaction) => tx.txHash !== transaction.txHash,
        ),
      });
    };

    EventBus.on('chainviz-disconnected', handleDisconnected);
    EventBus.on('block-finalized', handleBlockFinalized);
    EventBus.on('transaction-pending', handleTransactionPending);
    EventBus.on('transaction-proposed', handleTransactionProposed);
    EventBus.on('transaction-confirmed', handleTransactionConfirmed);
    EventBus.on('transaction-rejected', handleTransactionRejected);

    return () => {
      EventBus.off('chainviz-disconnected', handleDisconnected);
      EventBus.off('block-finalized', handleBlockFinalized);
      EventBus.off('transaction-pending', handleTransactionPending);
      EventBus.off('transaction-proposed', handleTransactionProposed);
      EventBus.off('transaction-confirmed', handleTransactionConfirmed);
      EventBus.off('transaction-rejected', handleTransactionRejected);
    };
  }, [updateState]);

  /**
   * Fetches a specific transaction by hash
   * @param txHash - Transaction hash to fetch
   * @returns Transaction data or null if failed
   */
  const getTransaction = useCallback(async (txHash: string): Promise<any | null> => {
    try {
      return await chainVizService.getTransaction(txHash);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }, []);

  /**
   * Fetches a specific block by number
   * @param blockNumber - Block number to fetch
   * @returns Block data or null if failed
   */
  const getBlock = useCallback(async (blockNumber: string): Promise<Block | null> => {
    try {
      return await chainVizService.getBlock(blockNumber);
    } catch (error) {
      console.error('Failed to get block:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    isConnecting,
    connect,
    disconnect,
    getTransaction,
    getBlock,
  };
}
