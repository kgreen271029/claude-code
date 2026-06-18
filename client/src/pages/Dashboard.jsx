import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'tiktok', 'youtube']);
  const [expandedVideo, setExpandedVideo] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(response.data.videos);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name);

    try {
      await axios.post('/api/videos/upload', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVideos();
    } catch (error) {
      alert('Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  const handleRepurpose = async (videoId) => {
    try {
      const response = await axios.post(
        `/api/videos/${videoId}/repurpose`,
        { platforms: selectedPlatforms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpandedVideo(videoId);
      // Refresh the video to show new repurposed content
      fetchVideos();
    } catch (error) {
      alert('Error repurposing video');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Content Repurposer</h1>
          <p>Multiply your content across platforms with AI-generated captions</p>
        </div>
        <div className="user-info">
          <p>Welcome, <strong>{user?.name || 'Creator'}</strong></p>
          <p>{user?.email}</p>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="video-upload">
        <h2>Upload Your Video</h2>
        <div className="upload-area">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="video-input"
            disabled={uploading}
          />
          <label htmlFor="video-input" style={{ cursor: 'pointer', width: '100%' }}>
            <p>📹 Click to upload or drag and drop</p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Supports MP4, MOV, WebM (Max 500MB)
            </p>
            {uploading && <p>Uploading...</p>}
          </label>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="video-list">
          <h2>Your Videos</h2>
          {videos.map(video => (
            <div key={video.id} className="video-item">
              <h3>{video.title || 'Untitled Video'}</h3>
              <p>Uploaded: {new Date(video.created_at).toLocaleDateString()}</p>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', display: 'block' }}>
                  Select Platforms:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {['tiktok', 'instagram', 'youtube', 'pinterest'].map(platform => (
                    <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                          }
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="video-actions">
                <button onClick={() => handleRepurpose(video.id)}>
                  🚀 Repurpose
                </button>
                <button onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}>
                  {expandedVideo === video.id ? '▼ Hide' : '▶ View'} Versions
                </button>
              </div>

              {expandedVideo === video.id && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>Generated Captions:</p>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {selectedPlatforms.map(platform => (
                      <div key={platform} style={{
                        background: '#f9fafb',
                        padding: '15px',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <h4 style={{ textTransform: 'uppercase', fontSize: '12px', color: '#5b21b6', marginBottom: '10px' }}>
                          {platform}
                        </h4>
                        <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginBottom: '10px' }}>
                          [AI-Generated Caption for {platform}]
                        </p>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <strong>Hashtags:</strong> #trending #content #{platform}
                        </div>
                        <button style={{ marginTop: '10px', width: 'auto', padding: '6px 12px', fontSize: '12px' }}>
                          📋 Copy Caption
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {videos.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No videos yet. Upload your first video to get started!</p>
        </div>
      )}
    </div>
  );
}
