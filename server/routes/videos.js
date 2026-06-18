import express from 'express';
import multer from 'multer';
import { verifyToken } from './auth.js';
import { getDb } from '../db/init.js';
import { generateCaptions } from '../services/caption-generator.js';

export const videoRouter = express.Router();

const upload = multer({ dest: 'uploads/' });

videoRouter.post('/upload', verifyToken, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const db = getDb();
  const { title, description } = req.body;

  try {
    const stmt = db.prepare('INSERT INTO videos (user_id, file_path, title, description) VALUES (?, ?, ?, ?)');
    const result = stmt.run(req.userId, req.file.path, title || '', description || '');

    res.json({
      id: result.lastInsertRowid,
      file_path: req.file.path,
      title: title || '',
      description: description || ''
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error saving video' });
  }
});

videoRouter.get('/list', verifyToken, (req, res) => {
  const db = getDb();

  try {
    const stmt = db.prepare('SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(req.userId);
    res.json({ videos: rows || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching videos' });
  }
});

videoRouter.post('/:videoId/repurpose', verifyToken, async (req, res) => {
  const { videoId } = req.params;
  const { description, platforms } = req.body;

  const db = getDb();

  try {
    const getStmt = db.prepare('SELECT * FROM videos WHERE id = ? AND user_id = ?');
    const video = getStmt.get(videoId, req.userId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const captions = await generateCaptions(description || video.description, platforms);
    const insertStmt = db.prepare('INSERT INTO repurposed_videos (video_id, platform, caption, hashtags) VALUES (?, ?, ?, ?)');
    const results = [];

    for (const platform of platforms) {
      const caption = captions[platform];
      const result = insertStmt.run(videoId, platform, caption.caption, caption.hashtags.join(' '));
      results.push({
        platform,
        caption: caption.caption,
        hashtags: caption.hashtags,
        id: result.lastInsertRowid
      });
    }

    res.json({
      video_id: videoId,
      repurposed: results
    });
  } catch (error) {
    console.error('Error repurposing video:', error);
    res.status(500).json({ error: 'Error generating captions' });
  }
});

videoRouter.get('/:videoId/repurposed', verifyToken, (req, res) => {
  const { videoId } = req.params;
  const db = getDb();

  try {
    const getVideoStmt = db.prepare('SELECT * FROM videos WHERE id = ? AND user_id = ?');
    const video = getVideoStmt.get(videoId, req.userId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const getRepurposedStmt = db.prepare('SELECT * FROM repurposed_videos WHERE video_id = ?');
    const rows = getRepurposedStmt.all(videoId);

    res.json({
      video: video,
      repurposed: rows || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching repurposed videos' });
  }
});
