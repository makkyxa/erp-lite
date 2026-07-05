# Changelog

All notable changes to the **ERP Lite** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-05

### Added
- **Multi-user authentication:** JWT Access/Refresh tokens with client-side automatic token refreshes via Axios interceptors.
- **Role-Based Access Control (RBAC):** Roles defined for `ADMIN`, `MANAGER`, and `ENGINEER` with matching route/controller decorators.
- **Order State Machine:** Status transition rules in repair orders (Created -> Waiting parts / In progress -> Ready -> Delivered) preventing invalid database states.
- **Activity log (System Audit):** Middleware capturing details of user requests, timestamps, IP addresses, and user-agents, writing them directly to audit tables.
- **Unified catalog & registers:** Modules for Customers, Cars, Catalog of Services, Warehouse inventory control, and Cash registry/payments registry.
- **Comments and Photo attachments:** Section inside repair orders for staff comments and photo uploads (Before/After/Documents).
- **Responsive MUI Dashboard:** Premium frontend UI layout with quick KPI summary counts (revenue, active orders, client base).

### Fixed
- **MissingGreenlet errors:** Integrated database object refreshing (`db.refresh`) after creations and updates inside the asynchronous transaction context, resolving serialization crashes.
- **CORS mappings:** Explicitly matched client/server origin permissions.
- **Russian Translations:** Statuses, priorities, and payment statuses fully localized to Russian in frontend tables and selection menus.

### Infrastructure
- **Docker Compose:** Orchestration configuration for local databases, FastAPI backend, and React/TypeScript frontend.
- **Makefile:** Common developer shortcuts (`up`, `down`, `logs`, `shell`).
