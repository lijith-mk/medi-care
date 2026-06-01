Smart Healthcare Backend

Setup

1. Copy `.env.example` to `.env` and fill values (including your MongoDB Atlas URI).
2. Install dependencies:

```bash
cd Backend
npm install
```

3. Run in development:

```bash
npm run dev
```

Notes
- `src/server.js` is the entry point.
- `src/config/db.js` connects to MongoDB using `process.env.MONGO_URI`.

Create admin manually

Set these environment variables in `.env` before running the script:

```bash
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=StrongPassword123
```

Then run:

```bash
npm run create:admin
```

This hashes the password with bcrypt and inserts a user with `role = "admin"` directly into MongoDB.
