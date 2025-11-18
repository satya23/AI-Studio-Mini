import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { validateRequest } from '../utils/validation.js';
import { signupSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/signup', validateRequest(signupSchema), signup);
router.post('/login', validateRequest(loginSchema), login);

export default router;
