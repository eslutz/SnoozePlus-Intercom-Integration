import { encrypt } from './crypto-utility';
import logger from '../config/logger-config';

const snoozeLogger = logger.child({ module: 'snooze-utility' });

// Take the request and determine how many snoozes were set.
const createSnoozeRequest = (input: any): SnoozeRequest => {
  snoozeLogger.info('Getting number of snoozes set.');
  // Get the keys from the inputs object and use array length property to get number of inputs.
  const keysArray = Object.keys(input.input_values);
  const keysArrayCount = keysArray.length;
  const snoozeCount = Math.floor(keysArrayCount / 2);
  snoozeLogger.info(`Number of snoozes set: ${snoozeCount}`);

  snoozeLogger.info('Getting messages and duration of each snooze.');
  // Get messages and send date for each snooze.
  let snoozeDurationTotal = 0;
  const messages: Array<Message> = [];
  for (let i = 1; i <= snoozeCount; i++) {
    // Encrypt the message before storing it.
    let encryptedMessage: string;
    snoozeLogger.info('Encrypting message.');
    snoozeLogger.profile('encrypt');
    try {
      encryptedMessage = encrypt(input.input_values[`message${i}`]);
    } catch (err) {
      snoozeLogger.error(`Error encrypting message: ${err}`);
      throw err;
    }
    snoozeLogger.profile('encrypt', {
      level: 'info',
      message: 'Message encrypted.',
    });

    snoozeLogger.debug(
      `Snooze duration: ${input.input_values[`snoozeDuration${i}`]}`
    );
    snoozeDurationTotal += Number(input.input_values[`snoozeDuration${i}`]);
    snoozeLogger.debug(`Current snooze duration total: ${snoozeDurationTotal}`);
    // Determine the send date as the current date and time plus the snooze duration.
    const sendDate = new Date();
    sendDate.setDate(
      sendDate.getDate() + Number(input.input_values[`snoozeDuration${i}`])
    );
    snoozeLogger.debug(`Message send date: ${sendDate}`);
    messages.push({
      message: encryptedMessage,
      sendDate: sendDate,
      closeConversation:
        i === snoozeCount && input.input_values.then === 'close',
    });
  }
  snoozeLogger.info(`Snooze messages: ${JSON.stringify(messages)}`);
  snoozeLogger.info(
    `Final snooze duration total: ${snoozeDurationTotal} day(s)`
  );

  snoozeLogger.info('Getting snooze until date.');
  // Get the date the snooze will end.
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDurationTotal);
  snoozeLogger.info(`Snooze until date: ${snoozeUntil}`);

  snoozeLogger.debug('Creating snooze request object.');
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

const setSnoozeCanceledNote = (messagesDeleted: number): string => {
  const messageLabel = messagesDeleted === 1 ? 'message' : 'messages';
  const note = `<p><strong>Snooze+ has been canceled.</stronger></p><br /><p>The remaining ${messagesDeleted} ${messageLabel} will not be sent.</p>`;

  return note;
};

const setCloseNote = (
  reasonClosed: string,
  messagesDeleted: number
): string => {
  const messageLabel = messagesDeleted === 1 ? 'message' : 'messages';
  const note = `<p><strong>Snooze+ has ended.</stronger></p><br /><p>The conversation has been ${reasonClosed}.</p><p>The remaining ${messagesDeleted} ${messageLabel} will not be sent.</p>`;

  return note;
};

const setLastMessageCloseNote = (): string => {
  const note = `<p><strong>Snooze+ has ended.</strong></p><br /><p>The last message has been sent and has closed the conversation.</p>`;

  return note;
};

const setSendMessageNote = (messageCount: number): string => {
  const messageLabel = messageCount === 1 ? 'message' : 'messages';
  const verbForm = messageCount === 1 ? 'is' : 'are';
  const note = `<p><strong>Snooze+ message sent.</strong></p><br /><p>A message has been sent.</p><p>There ${verbForm} ${messageCount} ${messageLabel} waiting to be sent.</p>`;

  return note;
};

const setSnoozeNote = (
  snoozeCount: number,
  snoozeDuration: number,
  snoozeUntil: Date
): string => {
  const dayLabel = snoozeDuration === 1 ? 'day' : 'days';
  const messageLabel = snoozeCount === 1 ? 'message' : 'messages';
  const note = `<p><strong>Snooze+ has been set.</strong></p><br /><p>The conversation will be snoozed for a total of ${snoozeDuration} ${dayLabel}, with ${snoozeCount} ${messageLabel} being sent.  The snooze will end on ${snoozeUntil.toLocaleDateString()}.</p>`;

  return note;
};

const setUnixTimestamp = (date: Date): number =>
  Math.floor(date.getTime() / 1000);

export default createSnoozeRequest;
export {
  setCloseNote,
  setSnoozeCanceledNote,
  setLastMessageCloseNote,
  setSendMessageNote,
  setUnixTimestamp,
};
