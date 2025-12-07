import type { PanMessage } from './message.js';

/**
 * Callback function for handling messages
 */
export type MessageHandler<T = any> = (message: PanMessage<T>) => void;

/**
 * Function to unsubscribe from a topic
 */
export type UnsubscribeFunction = () => void;
