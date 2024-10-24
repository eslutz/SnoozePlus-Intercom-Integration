import retry from 'retry';

const retries = Number(process.env.RETRY_ATTEMPTS) ?? 3;
const factor = Number(process.env.RETRY_FACTOR) ?? 2;
const minTimeout = Number(process.env.RETRY_MIN_TIMEOUT) ?? 1000;
const maxTimeout = Number(process.env.RETRY_MAX_TIMEOUT) ?? 5000;
const randomize = Boolean(process.env.RETRY_RANDOMIZE) ?? true;

const operation = retry.operation({
  retries: retries,
  factor: factor,
  minTimeout: minTimeout,
  maxTimeout: maxTimeout,
  randomize: randomize,
});

export default operation;
