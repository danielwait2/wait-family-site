# The Wait Family

A family recipe and story sharing website built with React and Express.

## Features

- 🍳 **Recipe Sharing**: Family members can submit recipes with categories, prep/cook times, and serving sizes
- 📖 **Family Stories**: Share family memories, videos, and articles
- 🔍 **Search & Filter**: Find recipes by category or search term
- 👤 **Admin Panel**: Moderate recipes and manage family content
- 🍪 **Persistent Authentication**: Cookie-based admin authentication
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express, SQLite
- **Database**: SQLite with better-sqlite3
- **Styling**: CSS with custom design system

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd NewWaitFamilySite
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your admin credentials
   npm start
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
SQLITE_DB_PATH=data/wait-family.db
```

### Client (`client/.env.production`)
```env
VITE_API_BASE_URL=https://thewaitfamily.com
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Google Cloud with nginx.

## Project Structure

```
.
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Page components
│   │   ├── services/# API services
│   │   └── ...
│   └── ...
├── server/          # Express backend
│   ├── src/
│   │   ├── index.js # API routes
│   │   └── db.js    # Database setup
│   ├── schema.sql   # Database schema
│   └── ...
├── DEPLOYMENT.md    # Deployment guide
└── nginx.conf.example # Nginx configuration
```

## Scripts

### Backend
- `npm start` - Start the server
- `npm run dev` - Start with nodemon (hot reload)

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

Private family project
