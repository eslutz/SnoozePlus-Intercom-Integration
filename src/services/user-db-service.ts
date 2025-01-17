import pool from '../config/db-config';
import logger from '../config/logger-config';
import operation from '../config/retry-config';
import { UserDTO } from '../models/dto-user-model';
import { User } from '../models/user-model';

const userDbLogger = logger.child({ module: 'user-db-service' });

const getUser = async (userId: number): Promise<UserDTO | null> => {
  const getUser = `
    SELECT id, access_token
    FROM users
    WHERE id = $1;
  `;
  const getParameters = [userId];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(getUser, getParameters);
        if (response.rowCount === 0) {
          userDbLogger.debug('User not found.');
          resolve(null);
        }

        const user: UserDTO = {
          id: response.rows[0].id,
          accessToken: response.rows[0].access_token,
        };
        userDbLogger.debug(`User found: ${JSON.stringify(user)}`);

        resolve(user);
      } catch (err) {
        userDbLogger.error(
          `Error executing get user query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

const saveUser = async (user: User): Promise<number> => {
  const saveUser = `
    INSERT INTO users (id, account_type, access_token, authorization_code)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      authorization_code = EXCLUDED.authorization_code
    RETURNING id;
  `;
  const saveParameters = [
    user.id,
    user.accountType,
    user.accessToken,
    user.authorizationCode,
  ];

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const response = await pool.query(saveUser, saveParameters);
        const userId: number = response.rows[0].id;
        userDbLogger.debug(`User saved with ID: ${userId}`);

        resolve(userId);
      } catch (err) {
        userDbLogger.error(
          `Error executing save user query on attempt ${currentAttempt}: ${err}`
        );
        if (operation.retry(err as Error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
};

export { getUser, saveUser };
