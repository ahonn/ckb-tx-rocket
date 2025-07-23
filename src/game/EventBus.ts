import { Events } from 'phaser';

/**
 * Global event bus for communication between React components and Phaser scenes
 */
export const EventBus = new Events.EventEmitter();