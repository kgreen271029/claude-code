# Content Repurposer API Documentation

Base URL: `http://localhost:3001/api` (local) or `https://your-domain.com/api` (production)

## Authentication

All endpoints (except `/auth/signup` and `/auth/login`) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Auth Endpoints

### POST `/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `400`: Email already exists
- `400`: Email and password required

---

### POST `/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "subscription_status": "active"
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `400`: Email and password required

---

## Video Endpoints

### POST `/videos/upload`
Upload a video file.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `video` (file, required): Video file (MP4, MOV, WebM)
- `title` (string, optional): Video title
- `description` (string, optional): Video description

**Response (200):**
```json
{
  "id": 1,
  "file_path": "uploads/filename.mp4",
  "title": "My Video",
  "description": "Video description"
}
```

**Errors:**
- `400`: No video file provided
- `500`: Error saving video

---

### GET `/videos/list`
Get all videos for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "videos": [
    {
      "id": 1,
      "user_id": 1,
      "file_path": "uploads/video.mp4",
      "title": "My Video",
      "description": "Description",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST `/videos/:videoId/repurpose`
Generate AI captions for multiple platforms.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "description": "A video about cooking tips",
  "platforms": ["tiktok", "instagram", "youtube", "pinterest"]
}
```

**Response (200):**
```json
{
  "video_id": 1,
  "repurposed": [
    {
      "id": 1,
      "platform": "tiktok",
      "caption": "Quick cooking tip you need to try! 🍳",
      "hashtags": ["#FYP", "#viral", "#cooking"]
    },
    {
      "id": 2,
      "platform": "instagram",
      "caption": "Love cooking? Check out this amazing tip...",
      "hashtags": ["#instagood", "#cooking", "#foodblog"]
    }
  ]
}
```

**Errors:**
- `404`: Video not found
- `500`: Error generating captions

---

### GET `/videos/:videoId/repurposed`
Get all repurposed versions of a video.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "video": {
    "id": 1,
    "user_id": 1,
    "file_path": "uploads/video.mp4",
    "title": "My Video",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "repurposed": [
    {
      "id": 1,
      "video_id": 1,
      "platform": "tiktok",
      "caption": "Quick cooking tip...",
      "hashtags": "#FYP #viral #cooking",
      "status": "ready",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

**Errors:**
- `404`: Video not found

---

## Subscription Endpoints

### POST `/subscriptions/create-checkout`
Create a Stripe checkout session for subscription.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "session_id": "cs_live_xxxxx",
  "url": "https://checkout.stripe.com/pay/..."
}
```

**Errors:**
- `500`: Error creating checkout session

---

### GET `/subscriptions/status`
Check subscription status for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "active",
  "is_subscriber": true
}
```

Possible status values:
- `"free"` - Free plan user
- `"active"` - Active subscription
- `"inactive"` - Inactive/canceled subscription

---

### POST `/subscriptions/webhook`
Webhook endpoint for Stripe events. (No authentication required)

**Headers:**
```
Content-Type: application/json
Stripe-Signature: t=timestamp,v1=signature
```

**Handled Events:**
- `customer.subscription.created` - Update subscription status to active
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Update subscription status to free

---

## Analytics Endpoints

### GET `/analytics/stats`
Get usage statistics for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "total_videos": 5,
  "total_captions": 15,
  "platform_breakdown": {
    "tiktok": 5,
    "instagram": 5,
    "youtube": 3,
    "pinterest": 2
  }
}
```

---

## Health Check

### GET `/health`
Check if the API is running.

**Response (200):**
```json
{
  "status": "ok",
  "message": "Content Repurposer API is running"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad request (missing/invalid data)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found (resource doesn't exist)
- `500` - Server error

---

## Rate Limits

Currently, there are no rate limits implemented. In production, consider adding:
- 100 requests/minute per user
- 10 video uploads/day per free user
- Unlimited for paid users

---

## Example Requests

### Complete Flow Example

1. **Sign up:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

2. **Upload video:**
```bash
curl -X POST http://localhost:3001/api/videos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@/path/to/video.mp4" \
  -F "title=My Video"
```

3. **Repurpose to platforms:**
```bash
curl -X POST http://localhost:3001/api/videos/1/repurpose \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A great video",
    "platforms": ["tiktok", "instagram", "youtube", "pinterest"]
  }'
```

4. **Get repurposed captions:**
```bash
curl -X GET http://localhost:3001/api/videos/1/repurposed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API Client Libraries

Use these libraries to interact with the API:

- **JavaScript/Node.js:** axios, fetch, superagent
- **Python:** requests, httpx
- **Go:** net/http
- **Rust:** reqwest
- **Ruby:** net/http, httparty

Example with axios:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get videos
const videos = await api.get('/videos/list');

// Upload and repurpose
const formData = new FormData();
formData.append('video', videoFile);
const upload = await api.post('/videos/upload', formData);

const captions = await api.post(`/videos/${upload.data.id}/repurpose`, {
  description: 'My video description',
  platforms: ['tiktok', 'instagram']
});
```

---

## Support

For issues or questions:
1. Check the API logs: `tail -f server.log`
2. Review the code in `/server/routes/`
3. Test endpoints with Postman or curl
4. Check the LAUNCH_CHECKLIST.md for setup help
