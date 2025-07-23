import { useRef, useEffect, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { useCKBChainViz } from './hooks/useCKBChainViz';
import { chainVizConfig } from './config/chainviz.config';

/**
 * Main application component that integrates Phaser game with CKB ChainViz
 */
function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const chainViz = useCKBChainViz();
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (chainVizConfig.autoConnect) {
      chainViz.connect();
    }
  }, [chainViz.connect]);

  return (
    <div id="app">
      <PhaserGame ref={phaserRef} />

      {showControls && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '250px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>CKB ChainViz</h3>
            <button
              onClick={() => setShowControls(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '10px' }}>
            Status:{' '}
            <span
              style={{
                color: chainViz.isConnected
                  ? '#00ff00'
                  : chainViz.isConnecting
                    ? '#ffff00'
                    : '#ff0000',
              }}
            >
              {chainViz.isConnecting
                ? 'Connecting...'
                : chainViz.isConnected
                  ? 'Connected'
                  : 'Disconnected'}
            </span>
          </div>

          {chainViz.error && (
            <div style={{ color: '#ff0000', marginBottom: '10px', fontSize: '12px' }}>
              Error: {chainViz.error}
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#cccccc', marginBottom: '10px' }}>
            URL: {chainVizConfig.url}
          </div>

          {chainViz.isConnected && (
            <div>
              <div>Latest Block: #{chainViz.latestBlock?.blockNumber || 'N/A'}</div>
              <div>Pending TXs: {chainViz.pendingTransactions?.length || 0}</div>
              <div>Proposed TXs: {chainViz.proposedTransactions?.length || 0}</div>
            </div>
          )}

          <div style={{ marginTop: '10px' }}>
            {!chainViz.isConnected ? (
              <button
                onClick={chainViz.connect}
                disabled={chainViz.isConnecting}
                style={{
                  background: '#0066cc',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: chainViz.isConnecting ? 'not-allowed' : 'pointer',
                }}
              >
                {chainViz.isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <button
                onClick={chainViz.disconnect}
                style={{
                  background: '#cc0000',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}

      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ChainViz
        </button>
      )}
    </div>
  );
}

export default App;
