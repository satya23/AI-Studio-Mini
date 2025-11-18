# AI-Studio-Mini

Mini AI Studio: The key idea is to simulate a fashion image generation experience as if you were integrating with Modelia's real API, with Express + SQLite backend, React/Tailwind frontend, JWT auth, image uploads, simulated 'Model overloaded' generations, and automated tests (Jest + Vitest)

## 🚀 Project Setup

This project is structured as a monorepo with separate frontend and backend applications.

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (optional, for containerized development)

### Installation

#### Option 1: Local Development

1. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

3. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:5050`

4. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

#### Option 2: Docker Compose

```bash
docker-compose up
```

This will start:
- Backend API on `http://localhost:5050`
- Frontend on `http://localhost:3000`
- PostgreSQL database (optional, currently using SQLite)

### Project Structure

```
AI-Studio-Mini/
├── frontend/          # React + TypeScript + Tailwind + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── auth.service.ts
│   │   ├── tests/     # Unit tests
│   │   │   ├── Login.test.tsx
│   │   │   ├── Signup.test.tsx
│   │   │   ├── AuthContext.test.tsx
│   │   │   ├── ProtectedRoute.test.tsx
│   │   │   └── auth.service.test.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── backend/           # Node.js + TypeScript + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── ...
│   ├── tests/        # Backend tests
│   ├── openapi.yaml  # API documentation
│   └── package.json
├── tests/            # E2E tests
│   └── e2e.spec.ts
├── docker-compose.yml
├── playwright.config.ts
├── package.json      # Root package.json for E2E tests
├── .eslintrc.json
├── .prettierrc
├── EVAL.md           # Implementation tracking
└── README.md
```

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI mode
- `npm run test:coverage` - Generate test coverage report

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Jest
- `npm run test:coverage` - Generate test coverage report

#### E2E Tests (Root)
- `npm run test:e2e` - Run all E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with UI mode
- `npm run test:e2e:headed` - Run E2E tests in headed mode
- `npm run test:e2e:debug` - Run E2E tests in debug mode

### Development Status

See [EVAL.md](./EVAL.md) for tracking of implemented features and tests.

#### ✅ Implemented Features
- **Authentication System**
  - User signup with email and password validation
  - User login with JWT token generation
  - Session persistence using localStorage
  - Protected routes requiring authentication
  - Logout functionality
  - Auto-redirect on authentication errors

- **Testing**
  - Unit tests for all authentication components
  - E2E tests for complete authentication flow
  - API endpoint testing

### Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM (routing)
- Axios (HTTP client)
- Vitest + React Testing Library (unit testing)
- Playwright (E2E testing)

**Backend:**
- Node.js
- Express
- TypeScript
- SQLite (better-sqlite3)
- Jest + Supertest (testing)
- JWT for authentication
- Zod for validation
- bcryptjs for password hashing

### Getting Started

#### Prerequisites
- Node.js 20+
- npm or yarn

#### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Studio-Mini
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (for E2E tests)
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Set up environment variables**
   
   Frontend (optional - defaults provided):
   ```bash
   cd frontend
   # Create .env file if needed
   VITE_API_URL=http://localhost:5050
   ```
   
   Backend (optional - defaults provided):
   ```bash
   cd backend
   # Create .env file if needed
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   PORT=5050
   ```

4. **Start development servers**
   
   Using Docker Compose (recommended):
   ```bash
   docker-compose up
   ```
   
   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050
   - Health Check: http://localhost:5050/health

#### Running Tests

**Unit Tests:**
```bash
# Frontend unit tests
cd frontend
npm test

# Backend unit tests
cd backend
npm test
```

**E2E Tests:**
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e
```

### API Endpoints

#### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate and get JWT token

#### Generations (Protected - requires authentication)
- `POST /generations` - Create a new image generation
- `GET /generations?limit=5` - Get last N generations (default: 5)

#### System
- `GET /health` - Health check endpoint

See `backend/openapi.yaml` for complete API documentation.

### Next Steps

Future PRs will implement:
1. ✅ Authentication (JWT signup/login) - **COMPLETED**
2. Image upload and generation features
3. Error handling and retry logic
4. ✅ Testing suite - **COMPLETED**
5. CI/CD pipeline
