import express from 'express';
import { User } from '../config/db.mjs';
import mail_service from '../utils/nodemailer.mjs';

const router = express.Router();

// POST /users — Contact / enquiry form submission
// Validates input → calls email service → ALWAYS returns JSON
router.post('/users', async (req, res) => {
    // Safe fallback: prevents crash if Content-Type header is missing
    const { name, email, phone, message } = req.body || {};

    // ── Validation (400 returned instantly, before any SMTP work) ─────────────
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: 'Required fields missing: name, email, and message are required',
        });
    }

    try {
        // mail_service handles its own try/catch and always resolves — never hangs
        await mail_service(req, res);
    } catch (error) {
        // Catch-all safety net — res.json() is guaranteed in every path
        console.error(`[/users route] Unexpected error: ${error.message}`);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;