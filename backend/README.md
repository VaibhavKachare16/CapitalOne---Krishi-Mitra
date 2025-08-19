# Krishi Mitra Backend API

A comprehensive backend API for the Krishi Mitra agricultural platform, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Management**: Complete CRUD operations for users
- **Aadhar Authentication**: Secure login using Aadhar numbers
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: Robust database with Mongoose ODM
- **Input Validation**: Comprehensive data validation and sanitization
- **Error Handling**: Centralized error handling and logging
- **Security**: CORS, rate limiting, and security headers

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Mongoose schema validation
- **Environment**: dotenv for configuration

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://Saurav:Saurav1234@cluster0.gvol9gs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=krishi_mitra_secret_key_2024
   PORT=5000
   NODE_ENV=development
   ```

4. **Test Database Connection**
   ```bash
   node test-connection.js
   ```

5. **Start the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/send-otp` - Send OTP to registered Aadhar number
- `POST /api/users/verify-otp` - Verify OTP and login user
- `POST /api/users/login` - Login with Aadhar number (Legacy)

### User Management
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/location/:state/:district` - Get users by location
- `GET /api/users/farmers` - Get all farmers

### Health Check
- `GET /` - API status
- `GET /health` - Health check with database status

## 📊 User Schema

The user schema includes comprehensive fields for agricultural users:

```javascript
{
  aadharNumber: String (12 digits, unique),
  firstName: String,
  lastName: String,
  email: String (unique),
  phoneNumber: String (10 digits),
  userType: Enum ['farmer', 'agricultural-expert', 'student', 'researcher', 'dealer'],
  location: {
    state: String,
    district: String,
    village: String
  },
  farmDetails: {
    totalAcres: Number,
    primaryCrops: [String],
    irrigationType: Enum ['rainfed', 'irrigated', 'mixed']
  },
  preferences: {
    language: Enum ['english', 'hindi', 'marathi', 'gujarati', 'punjabi'],
    notifications: {
      sms: Boolean,
      email: Boolean,
      push: Boolean
    }
  }
}
```

## 🔐 Authentication

The API uses a two-step OTP-based authentication system:

### OTP Flow:
1. **Send OTP**: Send Aadhar number to `/api/users/send-otp`
2. **Receive OTP**: OTP is generated and sent (in development, returned in response)
3. **Verify OTP**: Send Aadhar number + OTP to `/api/users/verify-otp`
4. **Receive Token**: JWT token for authenticated requests

### Security Features:
- **OTP Expiration**: OTPs expire after 5 minutes
- **Single Use**: Each OTP can only be used once
- **User Validation**: OTP is only sent if Aadhar exists in database
- **Rate Limiting**: Built-in protection against OTP abuse

### JWT Token Usage:
1. **Receive**: JWT token after successful OTP verification
2. **Use**: Include token in Authorization header: `Bearer <token>`
3. **Expiration**: Tokens expire after 30 days

## 🚦 Running the Server

### Development Mode
```bash
npm run dev
```
- Uses nodemon for auto-restart
- Runs on port 5000 (configurable)
- Enables detailed logging

### Production Mode
```bash
npm start
```
- Runs with Node.js
- Optimized for production
- Minimal logging

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |

## 🧪 Testing

Test the database connection:
```bash
node test-connection.js
```

Test the API endpoints using tools like:
- Postman
- Insomnia
- cURL
- Thunder Client (VS Code extension)

## 📚 API Documentation

### Register User
```bash
POST /api/users/register
Content-Type: application/json

{
  "aadharNumber": "123456789012",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "9876543210",
  "userType": "farmer",
  "location": {
    "state": "Maharashtra",
    "district": "Pune",
    "village": "Sample Village"
  }
}
```

### Send OTP
```bash
POST /api/users/send-otp
Content-Type: application/json

{
  "aadharNumber": "123456789012"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "aadharNumber": "1234 5678 9012",
  "expiresIn": "5 minutes",
  "otp": "123456" // Only in development mode
}
```

### Verify OTP and Login
```bash
POST /api/users/verify-otp
Content-Type: application/json

{
  "aadharNumber": "123456789012",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "_id": "user_id",
  "aadharNumber": "1234 5678 9012",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "userType": "farmer",
  "token": "jwt_token_here"
}
```

### Legacy Login (Direct Aadhar)
```bash
POST /api/users/login
Content-Type: application/json

{
  "aadharNumber": "123456789012"
}
```

## 🔒 Security Features

- **CORS Protection**: Configurable cross-origin requests
- **Input Validation**: Mongoose schema validation
- **JWT Security**: Secure token-based authentication
- **Error Handling**: No sensitive information in error responses
- **Rate Limiting**: Built-in request limiting (can be enhanced)

## 🚀 Deployment

1. **Set Environment Variables**
   - Configure production MongoDB URI
   - Set strong JWT secret
   - Configure CORS origins

2. **Build and Deploy**
   ```bash
   npm install --production
   npm start
   ```

3. **Process Management**
   - Use PM2 for production process management
   - Configure reverse proxy (Nginx/Apache)
   - Set up SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**Happy Coding! 🌱🚀**
