import express from 'express';
import * as initializeController from '../controllers/initialize-controller';
import { isLoggedIn } from '../middleware/auth-middleware';

const initializeRouter = express.Router();

initializeRouter
  .route('/')
  .post(isLoggedIn, initializeController.initialize)
  .get(isLoggedIn, (req, res) => {
    res.send(
      `Hello ${req.user?.displayName}! Your initialize request has been authenticated.`
    );
  });

export default initializeRouter;
