import type { PanMessage } from './message.js';

/**
 * Callback function for handling messages
 */
export type MessageHandler<T = any> = (message: PanMessage<T>) => void;

/**
 * Function to unsubscribe from a topic
 */
export type UnsubscribeFunction = () => void;

/** Detail of the `pan:subscribe` event. `subId` is absent for subscriptions made by older clients. */
export interface PanSubscribeDetail {
  clientId?: string;
  /** Unique id of this subscription; the bus tags deliveries for it as `PanDeliverEvent.panSubId`. */
  subId?: string;
  topics: string[];
  options?: { retained?: boolean };
}

/** Detail of the `pan:bye` event sent by `PanClient.dispose()`. */
export interface PanByeDetail {
  /** The disposing client's id. */
  id: string;
}

/**
 * The `pan:deliver` event. `detail` is the message (never modified); `panSubId` names the subscription
 * the delivery is for. It is absent when delivered by an older bus or to an untagged subscription,
 * in which case listeners filter by their own topic patterns.
 */
export interface PanDeliverEvent<T = unknown> extends CustomEvent<PanMessage<T>> {
  panSubId?: string;
}
