import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { validateRequest } from '../utils/validation.js';
import { signupSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/signup', validateRequest(signupSchema), signup);
router.post('/login', login);

export default router;
