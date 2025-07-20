# Trail Tracker Backend

Node.js/Express API for managing trail camera data, user authentication, and GPS pin locations.

## Features

- User authentication with bcrypt password hashing
- Trail camera photo upload and metadata management
- GPS pin system for camera locations
- File upload handling with Multer
- Data filtering and analytics
- User profile management

## Tech Stack

- Node.js, Express.js
- MongoDB with Mongoose
- bcryptjs, Multer, Body-parser

## Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

## Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd trailtracker-backend
   npm install
   ```

2. **Start MongoDB**
   ```bash
   brew services start mongodb-community
   ```

3. **Run server**
   ```bash
   node server.js
   ```

Server runs on port 5001 by default.

## Database Schema

```javascript
User: {
  username: String (unique),
  password: String (hashed),
  name: String,
  email: String (unique),
  profile_picture_url: String,
  gps_pins: Array,
  uploads: Array,
  location: Object
}
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user

### GPS Pins
- `POST /api/users/save_pin` - Save GPS pin
- `POST /api/users/get_pins` - Get user pins
- `PUT /api/users/update_pin/:camera_id` - Update pin
- `DELETE /api/users/delete_pin/:camera_id` - Delete pin

### File Management
- `POST /api/users/log-scan` - Log camera scan
- `POST /api/users/get_uploads_by_camera/:camera_id` - Get uploads by camera
- `POST /api/users/get_uploads` - Get filtered uploads
- `DELETE /api/users/delete_upload` - Delete upload

### User Profile
- `POST /api/users/profile` - Get user profile
- `POST /api/users/update_profile` - Update profile
- `POST /api/users/change_password` - Change password

### Location
- `POST /api/users/save_location` - Save user location
- `GET /api/users/get_camera_ids` - Get camera IDs

## Request/Response Examples

### Register User
```json
POST /api/users/register
{
  "username": "user123",
  "password": "password123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Save GPS Pin
```json
POST /api/users/save_pin
{
  "username": "user123",
  "name": "Camera 1",
  "camera_id": "CAM001",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Log Camera Scan
```json
POST /api/users/log-scan
{
  "username": "user123",
  "filepath": "/uploads/image.jpg",
  "camera_id": "CAM001",
  "animal": "deer",
  "pulled_data": "metadata",
  "date": "2024-01-01",
  "time": "12:00:00"
}
```

## Project Structure

```
trailtracker-backend/
├── server.js              # Main server
├── database.js            # Database connection
├── models/User.js         # User model
├── routes/user.js         # User routes
└── uploads/              # File uploads
```

## Configuration

### Environment Variables
- `PORT`: Server port (default: 5001)
- `MONGODB_URI`: MongoDB connection (default: mongodb://localhost:27017/trailcamapp)

### File Upload
- Directory: `./uploads`
- File naming: Timestamp-based
- Supported: Images (jpg, png, gif, etc.)

## Deployment

### Local Development
```bash
node server.js
```

### Production (AWS Elastic Beanstalk)
- Configured for AWS EB deployment
- Static file serving for uploads
- CORS enabled for frontend integration

## Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB service
brew services start mongodb-community

# Check if running
ps aux | grep mongod
```

### Port Already in Use
Change port in `server.js`:
```javascript
const PORT = process.env.PORT || 5002;
```

### File Upload Issues
- Ensure `uploads/` directory exists
- Check file permissions
- Verify file size limits

## Security

- Password hashing with bcryptjs
- Input validation on all endpoints
- Secure file upload handling
- Error handling and logging

## License

ISC License 