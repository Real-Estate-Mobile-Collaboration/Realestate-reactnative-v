# 🏠 Real Estate App

A modern, full-stack mobile application for real estate listings built with React Native (Expo) and Node.js. Browse, list, and manage properties with an elegant brown/earthy theme design.



## 📱 Screenshots

<p align="center">
  <img src="readmieimg/Screenshot_20251203-190001_Expo Go.jpg" width="200" alt="Welcome Screen" />
  <img src="readmieimg/Screenshot_20251203-190439_Expo Go.jpg" width="200" alt="Home Screen" />
  <img src="readmieimg/Screenshot_20251203-190525_Expo Go.jpg" width="200" alt="Property Details" />
  <img src="readmieimg/Screenshot_20251203-190554_Expo Go.jpg" width="200" alt="Profile Screen" />
</p>

---

## ✨ Features

### 🔐 Authentication
- User registration with email verification
- Secure login with JWT tokens
- Profile management with avatar upload
- Password encryption with bcrypt

### 🏡 Property Management
- Create, edit, and delete property listings
- Multiple image upload with gallery view
- Property categories: Apartment, House, Land, Studio
- Listing types: For Sale, For Rent
- Location picker with interactive maps

### 🗺️ Maps & Location
- Interactive maps using MapLibre + OpenStreetMap
- Property location visualization
- Location-based property search
- Mini-map preview on property cards

### 💬 Real-time Messaging
- Real-time chat between users using Socket.IO
- Message history and conversations list
- Online/offline status indicators
- Delete messages and conversations

### ❤️ Favorites
- Save favorite properties
- Quick access to saved listings
- Sync across devices

### 🔍 Search & Filters
- Search properties by title, location
- Filter by category, type, price range
- Sort by date, price

---

## 🛠️ Tech Stack

### Frontend (Mobile)
| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile framework |
| Expo SDK 50 | Development and build tooling |
| TypeScript | Type-safe JavaScript |
| React Navigation 6 | Navigation and routing |
| Expo Linear Gradient | Beautiful gradient effects |
| Socket.IO Client | Real-time communication |
| Axios | HTTP client |
| Expo Secure Store | Secure token storage |
| Expo Image Picker | Image selection |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| TypeScript | Type-safe JavaScript |
| MongoDB | NoSQL database |
| Mongoose | MongoDB ODM |
| Socket.IO | Real-time bidirectional communication |
| JWT | Authentication tokens |
| Cloudinary | Image storage and CDN |
| Multer | File upload handling |
| bcrypt | Password hashing |

---

## 📁 Project Structure

```
real-estate-app/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # Database & Cloudinary config
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Socket.IO service
│   │   ├── utils/             # Helper utilities
│   │   ├── app.ts             # Express app setup
│   │   └── index.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                     # React Native Expo app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Button, Input, Icon, etc.
│   │   │   ├── map/           # Map components
│   │   │   └── property/      # Property-related components
│   │   ├── config/            # App configuration
│   │   ├── context/           # React Context providers
│   │   ├── images/            # App images & backgrounds
│   │   ├── navigation/        # Navigation setup
│   │   ├── screens/           # App screens
│   │   ├── services/          # API & Socket services
│   │   └── types/             # TypeScript definitions
│   ├── App.tsx                # App entry point
│   ├── app.json               # Expo configuration
│   └── package.json
│
└── readmieimg/                 # README screenshots
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (local or Atlas)
- Cloudinary account
- Expo Go app (for testing on device)

### Environment Variables

Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/real-estate
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/real-estate-app.git
   cd real-estate-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install mobile dependencies**
   ```bash
   cd ../mobile
   npm install
   ```

4. **Configure API URL**
   
   Update `mobile/src/config/index.ts` with your computer's IP:
   ```typescript
   export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000/api';
   export const SOCKET_URL = 'http://YOUR_IP_ADDRESS:5000';
   ```
   
   > 💡 Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your IP

### Running the App

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the mobile app**
   ```bash
   cd mobile
   npx expo start
   ```

3. **Open on device**
   - Scan QR code with Expo Go app
   - Make sure phone and computer are on same WiFi network

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | Get all properties |
| GET | `/api/properties/:id` | Get property by ID |
| POST | `/api/properties` | Create property |
| PUT | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |
| GET | `/api/properties/user/my-properties` | Get user's properties |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get user favorites |
| POST | `/api/favorites/:propertyId` | Add to favorites |
| DELETE | `/api/favorites/:propertyId` | Remove from favorites |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get conversations |
| GET | `/api/messages/:userId` | Get messages with user |
| POST | `/api/messages` | Send message |
| DELETE | `/api/messages/:messageId` | Delete message |
| DELETE | `/api/messages/conversation/:recipientId` | Delete conversation |

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#8B4513` | Main brand color (Saddle Brown) |
| Secondary | `#D2691E` | Accent color (Chocolate) |
| Success | `#2E7D32` | Success states |
| Danger | `#C62828` | Error/delete states |
| Background | `#FAF9F7` | App background |

### Typography
- Clean, modern sans-serif fonts
- Bold headings with letter spacing
- Readable body text with warm colors

---

## 🔧 Configuration

### Mobile App Config (`mobile/src/config/index.ts`)

```typescript
// API URLs - Update with your server IP
export const API_BASE_URL = 'http://YOUR_IP:5000/api';
export const SOCKET_URL = 'http://YOUR_IP:5000';

// Map default region (Tunisia)
mapDefaultRegion: {
  latitude: 36.8065,
  longitude: 10.1815,
}
```

---


## 👨‍💻 Author

Built with ❤️ using React Native and Node.js

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - Amazing React Native tooling
- [MapLibre](https://maplibre.org/) - Open-source maps
- [OpenStreetMap](https://www.openstreetmap.org/) - Free map data
- [Cloudinary](https://cloudinary.com/) - Image management
- [MongoDB](https://www.mongodb.com/) - Database solution
