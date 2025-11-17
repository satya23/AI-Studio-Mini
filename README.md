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
   Server will run on `http://localhost:5000`

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
- Backend API on `http://localhost:5000`
- Frontend on `http://localhost:3000`
- PostgreSQL database (optional, currently using SQLite)

### Project Structure

```
AI-Studio-Mini/
├── frontend/          # React + TypeScript + Tailwind + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── tests/
│   │   └── ...
│   └── package.json
├── backend/           # Node.js + TypeScript + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── ...
│   └── package.json
├── docker-compose.yml
├── .eslintrc.json
├── .prettierrc
└── EVAL.md           # Implementation tracking
```

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Generate test coverage report

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Jest
- `npm run test:coverage` - Generate test coverage report

### Development Status

See [EVAL.md](./EVAL.md) for tracking of implemented features and tests.

### Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Vitest + React Testing Library

**Backend:**
- Node.js
- Express
- TypeScript
- SQLite (better-sqlite3)
- Jest + Supertest
- JWT for authentication
- Zod for validation

### Next Steps

This is the initial project setup. Future PRs will implement:
1. Authentication (JWT signup/login)
2. Image upload and generation features
3. Error handling and retry logic
4. Testing suite
5. CI/CD pipeline
