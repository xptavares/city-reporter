import { Router } from 'express';
import * as auth from '../controllers/auth-controller';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', auth.register);
authRouter.post('/login', auth.login);
authRouter.get('/me', requireAuth, auth.me);
