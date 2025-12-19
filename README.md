# Liberty Docs Portal

> *"Education is the passport to the future, for tomorrow belongs to those who prepare for it today."*

## About Liberty

**Liberty** was created with a simple but powerful mission: to make educational content accessible, organized, and available for future use.

Education plays a vital role in our lives. It shapes careers, opens doors, and empowers individuals to reach their full potential. Yet valuable learning materials—lecture notes, study guides, videos, research papers—are often scattered, lost, or difficult to retrieve when needed most.

Liberty solves this problem by providing a centralized platform where educational content can be stored, organized into folders, and accessed anytime. Whether you're a student archiving lecture materials, an educator sharing resources, or an institution preserving knowledge for future generations, Liberty is built for you.

## Key Features

- **User Authentication** – Secure signup/login with JWT-based sessions
- **Role-Based Access** – Users and Admins with distinct permissions
- **Folder Organization** – Create folders to categorize content
- **File Storage** – Upload and manage documents, images, videos, and PDFs
- **Admin Panel** – Manage users, approve admin requests, and control content
- **Request Admin Access** – Users can apply to become administrators
- **Real-Time Data** – Content stored in PostgreSQL (Neon) for reliable persistence

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend     | Node.js, Express                        |
| Database    | PostgreSQL (Neon)                       |
| Auth        | JWT, bcryptjs                           |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Neon](https://neon.tech) PostgreSQL database (or any Postgres instance)

### Installation

```bash
# Clone the repository
git clone https://github.com/Dunama/liberty-docs-portal.git
cd liberty-docs-portal

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=your_jwt_secret_here
VITE_API_URL=http://localhost:4000
PORT=4000
```

### Database Setup

Run the SQL in `server/schema.sql` in your Neon SQL editor (or psql) to create tables and seed the default admin.

### Running the Application

```bash
# Terminal 1 – Start the backend API
npm run server

# Terminal 2 – Start the frontend dev server
npm run dev
```

- Frontend: http://localhost:8080 (or the port Vite assigns)
- Backend API: http://localhost:4000


## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve Liberty.

## License

This project is open source and available under the [MIT License](LICENSE).

---

