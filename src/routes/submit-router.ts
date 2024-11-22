import express from 'express';
import * as submitController from '../controllers/submit-controller';
import { isLoggedIn } from '../middleware/auth-middleware';

const submitRouter = express.Router();

submitRouter
  .route('/')
  .post(isLoggedIn, submitController.submit)
  .get(isLoggedIn, (req, res) => {
    res.send(
      `Hello ${req.user?.displayName}! Your submit request has been authenticated.`
    );
  });

export default submitRouter;
