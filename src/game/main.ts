import { Game as MainGame } from './scenes/Game';
import { ChainVisualizationScene } from './scenes/ChainVisualizationScene';
import { AUTO, Game, Types } from 'phaser';

/**
 * Phaser game configuration
 */
const config: Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        MainGame,
        ChainVisualizationScene
    ]
};

/**
 * Creates and starts a new Phaser game instance
 * @param parent - DOM element ID to mount the game to
 * @returns Phaser Game instance
 */
const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
