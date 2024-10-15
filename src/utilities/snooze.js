'use strict';

const logger = require('../config/logger-config');

// Take the input value object and determine how many snoozes were set.
const getSnoozeSummary = (inputs) => {
  logger.info('Getting number of snoozes set.');
  // Get the keys from the inputs object and use array length property to get number of inputs.
  const keysArray = Object.keys(inputs);
  const keysArrayCount = keysArray.length;
  const snoozeCount = Math.floor(keysArrayCount / 2);
  logger.debug(`Input keys: ${keysArray}`);
  logger.debug(`Input keys count: ${keysArrayCount}`);
  logger.info(`Number of snoozes set: ${snoozeCount}`);

  logger.info('Getting lengths of snoozes.');
  // Get length for each snooze.
  const snoozeLengths = [];
  for (let i = 1; i <= snoozeCount; i++) {
    logger.debug(`Snooze length: ${inputs[`snoozeLength${i}`]}`);
    snoozeLengths.push(inputs[`snoozeLength${i}`]);
  }
  logger.info(`Snooze lengths: ${snoozeLengths.join(', ')}`);

  // Get total snooze length.
  const totalSnoozeLength = snoozeLengths.reduce(
    (sum, currentValue) => sum + Number(currentValue),
    0
  );
  logger.info(`Total snooze length: ${totalSnoozeLength}`);

  logger.info('Getting snooze until date.');
  // Get the date the snooze will end.
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + totalSnoozeLength);
  logger.info(`Snooze until date: ${snoozeUntil}`);

  return { length: totalSnoozeLength, until: snoozeUntil };
};

module.exports = { getSnoozeSummary };
