import { encrypt } from './crypto-utility.js';
import logger from '../config/logger-config.js';
import { Message } from '../models/message-model.js';
import { SnoozeRequest } from '../models/snooze-request-model.js';
import { IntercomCanvasInput } from '../models/intercom-request-canvas-model.js';

const snoozeLogger = logger.child({ module: 'snooze-utility' });

/**
 * Calculates the number of days until a specified send date.
 *
 * @function calculateDaysUntilSending
 * @param sendDate The date a message is sent.
 * @returns {number} The number of days from the current date until the send date.
 */
const calculateDaysUntilSending = (sendDate: Date): number => {
  const currentDate = new Date();
  // Difference in time between current date and send date in milliseconds
  const timeDifference = sendDate.getTime() - currentDate.getTime();
  // Convert the time difference to days (1000 milliseconds/second * 3600 seconds/hour * 24 hours/day)
  const daysUntilSending = Math.ceil(timeDifference / (1000 * 3600 * 24));

  return daysUntilSending;
};

/**
 * Creates a snooze request object based on the provided input.
 *
 * @function createSnoozeRequest
 * @param input The input object containing snooze details.
 * @returns {SnoozeRequest} A `SnoozeRequest` object containing the messages, note, and snooze until timestamp.
 * @throws Will throw an error if message encryption fails.
 */
const createSnoozeRequest = (input: IntercomCanvasInput): SnoozeRequest => {
  snoozeLogger.debug('Getting number of snoozes set.');
  // Get the keys from the inputs object and use array length property to get number of inputs.
  const keysArray = Object.keys(input);
  const keysArrayCount = keysArray.length;
  const snoozeCount = Math.floor(keysArrayCount / 2);
  snoozeLogger.debug(`Number of snoozes set: ${snoozeCount}`);

  snoozeLogger.debug('Getting messages and duration of each snooze.');
  // Get messages and send date for each snooze.
  let snoozeDurationTotal = 0;
  const messages: Message[] = [];
  for (let i = 1; i <= snoozeCount; i++) {
    // Encrypt the message before storing it.
    let encryptedMessage: string;
    snoozeLogger.debug('Encrypting message.');
    snoozeLogger.profile('encrypt');
    try {
      encryptedMessage = encrypt(input[`message${i}`]);
    } catch (err) {
      snoozeLogger.error(`Error encrypting message: ${String(err)}`);
      throw err;
    }
    snoozeLogger.profile('encrypt', {
      level: 'debug',
      message: 'Message encrypted.',
    });

    snoozeLogger.debug(
      `Snooze duration - message ${i}: ${input[`snoozeDuration${i}`]}`
    );
    snoozeDurationTotal += Number(input[`snoozeDuration${i}`]);
    snoozeLogger.debug(`Current snooze duration total: ${snoozeDurationTotal}`);
    // Determine the send date as the current date and time plus the snooze duration.
    const sendDate = new Date();
    sendDate.setUTCDate(sendDate.getUTCDate() + snoozeDurationTotal);
    snoozeLogger.debug(`Message send date (UTC): ${sendDate.toISOString()}`);
    messages.push({
      message: encryptedMessage,
      sendDate: sendDate,
      closeConversation: i === snoozeCount && input.then === 'close',
    } as Message);
  }

  // Get the date the snooze will end.
  const snoozeUntil = new Date(messages[messages.length - 1].sendDate);
  snoozeLogger.debug(`Snooze until date set: ${snoozeUntil.toISOString()}`);

  const snoozeRequest: SnoozeRequest = {
    messages: messages,
    note: setSnoozeNote(snoozeCount, snoozeDurationTotal, snoozeUntil),
    snoozeUntilUnixTimestamp: setUnixTimestamp(snoozeUntil),
  };
  snoozeLogger.debug(
    `Snooze request object created: ${JSON.stringify(snoozeRequest)}`
  );

  return snoozeRequest;
};

/**
 * Generates an HTML note indicating that the snooze has been canceled and specifies the number of messages that will not be sent.
 *
 * @function setSnoozeCanceledNote
 * @param messagesDeleted The number of messages that were scheduled to be sent but will now be canceled.
 * @returns {string} A formatted HTML string.
 */
const setSnoozeCanceledNote = (messagesDeleted: number): string => {
  const messageLabel = messagesDeleted === 1 ? 'message' : 'messages';
  const note = `<p><strong>Snooze+ has been canceled.</stronger></p><br /><p>The remaining ${messagesDeleted} ${messageLabel} will not be sent.</p>`;

  return note;
};

/**
 * Generates a closing note in HTML format for a conversation that has ended triggered by a webhook.
 *
 * @function setCloseNote
 * @param reasonClosed The reason why the conversation was closed.
 * @param messagesDeleted The number of messages that were deleted.
 * @returns {string} A formatted HTML string.
 */
const setCloseNote = (
  reasonClosed: string,
  messagesDeleted: number
): string => {
  const messageLabel = messagesDeleted === 1 ? 'message' : 'messages';
  const note = `<p><strong>Snooze+ has ended.</stronger></p><br /><p>The conversation has been ${reasonClosed}.</p><p>The remaining ${messagesDeleted} ${messageLabel} will not be sent.</p>`;

  return note;
};

/**
 * Generates a closing note in HTML format indicating that Snooze+ has ended and the last message has been sent.
 *
 * @function setLastMessageCloseNote
 * @returns {string} A formatted HTML string.
 */
const setLastMessageCloseNote = (): string => {
  const note = `<p><strong>Snooze+ has ended.</strong></p><br /><p>The last message has been sent and has closed the conversation.</p>`;

  return note;
};

/**
 * Generates a note in HTML format indicating the number of messages waiting to be sent.
 *
 * @function setSendMessageNote
 * @param messageCount The number of messages waiting to be sent.
 * @returns {string} A formatted HTML string.
 */
const setSendMessageNote = (messageCount: number): string => {
  const messageLabel = messageCount === 1 ? 'message' : 'messages';
  const verbForm = messageCount === 1 ? 'is' : 'are';
  const note = `<p><strong>Snooze+ message sent.</strong></p><br /><p>A message has been sent.</p><p>There ${verbForm} ${messageCount} ${messageLabel} waiting to be sent.</p>`;

  return note;
};

/**
 * Generates a note in HTML format when a snooze had been set with details of the snooze.
 *
 * @function setSnoozeNote
 * @param snoozeCount The number of messages to be sent during the snooze period.
 * @param snoozeDuration The duration of the snooze period in days.
 * @param snoozeUntil The date until which the conversation is snoozed.
 * @returns {string} A formatted HTML string.
 */
const setSnoozeNote = (
  snoozeCount: number,
  snoozeDuration: number,
  snoozeUntil: Date
): string => {
  const dayLabel = snoozeDuration === 1 ? 'day' : 'days';
  const messageLabel = snoozeCount === 1 ? 'message' : 'messages';
  const note = `<p><strong>Snooze+ has been set.</strong></p><br /><p>The conversation will be snoozed for a total of ${snoozeDuration} ${dayLabel}, with ${snoozeCount} ${messageLabel} being sent.  The last message will send on ${snoozeUntil.toLocaleDateString()}.</p>`;

  return note;
};

/**
 * Converts a given Date object to a Unix timestamp.
 *
 * @function setUnixTimestamp
 * @param date The Date object to be converted.
 * @returns {number} The Unix timestamp as a number.
 */
const setUnixTimestamp = (date: Date): number =>
  Math.floor(date.getTime() / 1000);

export {
  calculateDaysUntilSending,
  createSnoozeRequest,
  setCloseNote,
  setSnoozeCanceledNote,
  setLastMessageCloseNote,
  setSendMessageNote,
  setUnixTimestamp,
};
