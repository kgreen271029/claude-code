import express from 'express';
import { verifyToken } from './auth.js';
import { getDb } from '../db/init.js';

export const analyticsRouter = express.Router();

analyticsRouter.get('/stats', verifyToken, (req, res) => {
  const db = getDb();

  try {
    const videoStmt = db.prepare('SELECT COUNT(*) as count FROM videos WHERE user_id = ?');
    const videoCount = videoStmt.get(req.userId).count;

    const repurposedStmt = db.prepare(`
      SELECT COUNT(*) as count FROM repurposed_videos
      WHERE video_id IN (SELECT id FROM videos WHERE user_id = ?)
    `);
    const repurposedCount = repurposedStmt.get(req.userId).count;

    const platformStmt = db.prepare(`
      SELECT platform, COUNT(*) as count FROM repurposed_videos
      WHERE video_id IN (SELECT id FROM videos WHERE user_id = ?)
      GROUP BY platform
    `);
    const platformStats = platformStmt.all(req.userId);

    res.json({
      total_videos: videoCount,
      total_captions: repurposedCount,
      platform_breakdown: platformStats.reduce((acc, stat) => {
        acc[stat.platform] = stat.count;
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});
