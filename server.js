import express from 'express';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

app.post('/submit', async (req, res) => {
  const { answers } = req.body;
  const recipientEmail = 'disckocrip@gmail.com';

  if (!answers) return res.status(400).json({ error: 'Missing answers' });

  try {
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      let buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      doc.fontSize(12).text('Answers:', { underline: true }).moveDown();

      const items = Array.isArray(answers) ? answers : [answers];
      items.forEach((ans, idx) => {
        doc.text(`${idx + 1}. ${ans}`);
      });

      doc.end();
    });

    const info = await transporter.sendMail({
      from: `"Survey System" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: 'New Answers Submission',
      text: 'Please find the attached PDF containing the submitted answers.',
      attachments: [{ filename: 'answers.pdf', content: pdfBuffer }]
    });

    console.log('Email sent successfully! ID:', info.messageId);
    res.json({ success: true, messageId: info.messageId });

  } catch (err) {
    console.error("Full Error Stack:", err);
    res.status(500).json({
      error: 'Failed to send email',
      details: err.message,
      code: err.code
    });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));