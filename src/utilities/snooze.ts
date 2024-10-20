import logger from '../config/logger-config';

// Take the input value object and determine how many snoozes were set.
const createSnoozeRequest = (input: any): SnoozeRequest => {
  logger.info('Getting workspace, admin, and conversation ids.');
  const workspaceId = input.workspace_id;
  const adminId = input.admin.id;
  const conversationId = input.conversation.id;
  logger.info('Workspace, admin, and conversation ids retrieved.');

  logger.info('Getting number of snoozes set.');
  // Get the keys from the inputs object and use array length property to get number of inputs.
  const keysArray = Object.keys(input.input_values);
  const keysArrayCount = keysArray.length;
  const snoozeCount = Math.floor(keysArrayCount / 2);
  logger.info(`Number of snoozes set: ${snoozeCount}`);

  logger.info('Getting messages and duration of each snooze.');
  // Get messages and send date for each snooze.
  let snoozeDurationTotal = 0;
  const messages: Array<Message> = [];
  for (let i = 1; i <= snoozeCount; i++) {
    logger.debug(
      `Snooze duration: ${input.input_values[`snoozeDuration${i}`]}`
    );
    snoozeDurationTotal += Number(input.input_values[`snoozeDuration${i}`]);
    logger.debug(`Current snooze duration total: ${snoozeDurationTotal}`);
    logger.debug(`Message: ${input.input_values[`message${i}`]}`);
    // Determine the send date as the current date and time plus the snooze duration.
    const currentDate = new Date();
    const sendDate = new Date(
      currentDate.getDate() + Number(input.input_values[`snoozeDuration${i}`])
    );
    logger.debug(`Message send date: ${sendDate}`);
    messages.push({
      message: input.input_values[`message${i}`],
      sendDate: sendDate,
    });
  }
  logger.info(`Snooze messages: ${JSON.stringify(messages)}`);
  logger.info(`Final snooze duration total: ${snoozeDurationTotal}`);

  logger.info('Getting snooze until date.');
  // Get the date the snooze will end.
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDurationTotal);
  logger.info(`Snooze until date: ${snoozeUntil}`);

  const snoozeRequest: SnoozeRequest = {
    workspaceId: workspaceId,
    adminId: adminId,
    conversationId: conversationId,
    messages: messages,
    snoozeDetails: {
      snoozeCount: snoozeCount,
      snoozeDuration: snoozeDurationTotal,
      snoozeUntil: snoozeUntil,
      snoozeUntilUnixTimestamp: setUnixTimestamp(snoozeUntil),
      snoozeNote: setSnoozeNote(snoozeCount, snoozeDurationTotal, snoozeUntil),
    },
  };

  return snoozeRequest;
};

const setSnoozeNote = (
  snoozeCount: number,
  snoozeDuration: number,
  snoozeUntil: Date
): string => {
  const time = snoozeCount > 1 ? 'times' : 'time';
  const day = snoozeDuration > 1 ? 'days' : 'day';
  const note = `<p><strong>Snooze+ has been set.</strong></p><br /><p>The conversation will be snoozed ${snoozeCount} ${time} for a total of ${snoozeDuration} ${day}.  The snooze will end on ${snoozeUntil.toLocaleDateString()}.</p>`;

  return note;
};

const setUnixTimestamp = (date: Date): number =>
  Math.floor(date.getTime() / 1000);

export { createSnoozeRequest, setSnoozeNote, setUnixTimestamp };
