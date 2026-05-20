import express from 'express';
import {User} from '../config/db.mjs';
import mail_service from '../utils/nodemailer.mjs';
const router = express.Router();





router.post('/users', async (req, res) => {
    try {
        mail_service(req, res);

      
    } catch (error) {
        res.status(500).json({ error: error.message });
    }   
});

export default router;