import retry from 'retry';

const operation = retry.operation({
  retries: 5,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 5000,
  randomize: true,
});

export default operation;
