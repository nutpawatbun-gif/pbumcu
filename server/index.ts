import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServerApp } from './app.js';
import { RAW_EXAMS_DATA } from '../src/data/initialExams.js';
import { FileStorageAdapter } from './storage/storageAdapter.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const storage = new FileStorageAdapter();

// Seed initial courses if storage is fresh
storage.seedCourses(RAW_EXAMS_DATA).catch(err => {
  console.error('Failed to seed courses:', err);
});

const { app } = createServerApp({
  storage,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === 'true' || process.env.NODE_ENV !== 'production'
});

// Serve frontend static build if dist exists (Production Mode)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MCU Exam Secure Server] Listening on http://localhost:${PORT}`);
  console.log(`[Environment] NODE_ENV=${process.env.NODE_ENV || 'development'}, DevLogin=${process.env.ALLOW_DEV_LOGIN === 'true' || process.env.NODE_ENV !== 'production'}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
