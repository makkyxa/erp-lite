# ERP Lite — Service Center Management System

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**ERP Lite** is an open-source ERP/CRM system for small repair shops and automotive service centers.

It provides customer management, work orders, warehouse inventory, employee management, payments, audit logging, and role-based access control in a modern full-stack web application.

---

## 📸 Screenshots

* **Login View:**
  ![Login View](docs/images/login.png)

* **Dashboard Analytics:**
  ![Dashboard](docs/images/dashboard.png)

* **Customers Registry:**
  ![Customers Registry](docs/images/customers.png)

* **Work Orders:**
  ![Work Orders](docs/images/orders.png)

* **Warehouse Inventory:**
  ![Warehouse Inventory](docs/images/warehouse.png)

* **Employee Management:**
  ![Employee Management](docs/images/users.png)

---

## ✨ Features

- **Multi-User Authentication:** Secure JWT-based auth flow featuring Access and Refresh tokens with automated background token refreshing.
- **Role-Based Access Control (RBAC):** Distinct roles (`ADMIN`, `MANAGER`, `ENGINEER`) with tailored backend API guards and dynamic client-side route authorization.
- **State Machine for Order Statuses:** Strict status transition rules in repair orders (`Created -> Waiting parts / In progress -> Ready -> Delivered`) preventing business logic errors.
- **Activity Log Audit Trail:** Automatic middleware recording system-wide user actions, timestamps, client IPs, and user-agent strings.
- **Unified Catalog Registers:** Core modules for Customers, Cars, Catalog of Services, Warehouse inventory control, and Cash registry/payments registry.
- **Work Notes & Photos:** Ability to attach comments and files/photos representing state before and after repairs.
- **Analytics Dashboard:** Graphical summary statistics and financial KPI metrics (active orders, completed, revenue).

---

## 🛠 Tech Stack

### Backend
- **Python 3.12**
- **FastAPI** — high-performance asynchronous web framework.
- **SQLAlchemy 2.0 (Async)** — modern database toolkit and ORM.
- **Alembic** — lightweight database migration tool.
- **PostgreSQL 16** — powerful, open-source object-relational database.
- **Pydantic v2** — fast data validation and settings management.
- **JWT (PyJWT)** — token generation and decryption.
- **Passlib (bcrypt)** — standard password hashing.

### Frontend
- **React 18**
- **TypeScript** — static type checker for client code.
- **Vite** — next-generation frontend toolchain.
- **Material UI (MUI v9)** — modern component library implementing Google's Material Design.
- **React Hook Form + Zod** — client-side validation and schema declaration.
- **Axios** — HTTP client with interceptors for token automatic headers injection.
- **React Query (TanStack Query)** — powerful server state synchronization and caching.

---

## 📐 Architecture

The application adheres to **Layered Architecture** principles, enforcing separation of concerns:

```mermaid
graph TD
    Client[React App / Vite] <-->|HTTP / Axios Interceptors| API[FastAPI Controllers]
    API <-->|Pydantic Schemas / DTOs| Services[Service Layer / Business Logic]
    Services <--> Repos[Repositories / Data Access Layer]
    Repos <-->|SQLAlchemy AsyncPG| DB[(PostgreSQL Database)]
```

* **Data Access Layer:** Standardized repository pattern inherits from a generic `BaseRepository[ModelType]`, handling common async CRUD queries.
* **Service Layer:** Encapsulates business logic, integrity validations, role permissions check, and raises specific domain exceptions mapped to HTTP statuses.
* **Middleware Interceptors:**
  * Request timing tracker (`timing.py`).
  * Request correlation ID injector (`request_id.py`).
  * Comprehensive HTTP request/response logger (`logging.py`).

---

## 🚀 Installation & Setup

### Default Ports
* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:8000](http://localhost:8000)
* **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **PostgreSQL Database:** `localhost:5432`

### 🔑 Demo Account (Development Credentials)
* **Username:** `admin`
* **Password:** `adminpassword`

---

### Docker Setup (Recommended)

1. Clone the repository and copy the environment template:
   ```bash
   git clone https://github.com/makkyxa/erp-lite.git
   cd erp-lite
   cp .env.example .env
   ```
2. Start the services using Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
3. Run Alembic migrations:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```
4. Seed the database with the default admin account:
   ```bash
   docker-compose exec backend python seed.py
   ```

---

### Local Setup (Without Docker)

Ensure you have **Python 3.12**, **Node.js 20+**, and a running **PostgreSQL 16** server.

#### 1. Database Configuration
Create a database named `erp_lite` in your PostgreSQL instance.

#### 2. Backend Installation
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Set up virtual environment and install requirements:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a local `.env` inside `backend/` and configure database connection parameters:
   ```env
   ENVIRONMENT=development
   SECRET_KEY=your_secret_key_here
   DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/erp_lite
   BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
4. Run migrations:
   ```bash
   alembic upgrade head
   ```
5. Seed database:
   ```bash
   python seed.py
   ```
6. Start Uvicorn development server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

#### 3. Frontend Installation
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Launch Vite development server:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
erp-lite/
├── backend/
│   ├── app/
│   │   ├── api/             # HTTP Route Controllers
│   │   ├── core/            # Config, Security, Exceptions
│   │   ├── database/        # Database sessions & connections
│   │   ├── middleware/      # Logger, Timing, RequestID middlewares
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── repositories/    # Database Repository handlers (DAL)
│   │   ├── schemas/         # Pydantic Schemas / DTOs
│   │   ├── services/        # Business Logic Services
│   │   └── utils/           # Filtering, pagination, validators
│   ├── migrations/          # Alembic database migrations
│   └── seed.py              # Seeding script
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI widgets (DataTable, Dialogs)
│   │   ├── hooks/           # Custom React hooks (useAuth, useToast)
│   │   ├── layout/          # Page layouts (Sidebar, Header, Layout)
│   │   ├── pages/           # View pages (Orders, Warehouse, Customers)
│   │   ├── services/        # API integration clients (Axios api instance)
│   │   ├── types/           # TypeScript Type definitions
│   │   └── App.tsx          # Main React component
```

---

## 🔗 Key API Modules Reference

- **`POST /api/v1/auth/login`**: Authenticates user and issues access & refresh tokens.
- **`POST /api/v1/auth/refresh`**: Exchanges expired access token using valid refresh token.
- **`GET /api/v1/auth/me`**: Fetches details of currently authenticated user profile.
- **`GET /api/v1/users`**: List all system employees (restricted to role: `ADMIN`).
- **`GET /api/v1/orders`**: Lists active repair orders (Engineers see only assigned orders; Admins/Managers see all).
- **`PATCH /api/v1/orders/{id}/status?status_in=...`**: Moves an order through the status flow.
- **`GET /api/v1/warehouse`**: Checks spare parts stock levels.
- **`POST /api/v1/payments`**: Registers a checkout cash receipt linked to a repair order.
- **`GET /api/v1/logs`**: Lists user audit activities (restricted to role: `ADMIN`).

---

## 🗺 Roadmap

- [ ] File Uploads (S3 / MinIO integration for binary photos upload).
- [ ] Automated Stock Deductions (Deduct warehouse inventory quantity when items are added to a repair order).
- [ ] PDF Exporter (Export invoices, receipts, and order intake PDF sheets).
- [ ] Email & Telegram Notifications (Notify mechanics of assignments, and customers of progress).
- [ ] Live updates using WebSockets for the orders dashboard view.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
