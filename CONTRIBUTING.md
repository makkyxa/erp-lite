# Contributing to ERP Lite

First off, thank you for considering contributing to ERP Lite! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

## How Can I Contribute?

### Reporting Bugs
* **Check existing issues:** Before opening a new issue, search the tracker to see if the bug has already been reported.
* **Describe the problem:** Include clear, specific steps to reproduce the bug, the expected behavior, and what actually occurred.
* **Share environment details:** Mention your OS, Python version, Node.js version, and database setup.

### Suggesting Enhancements
* **Open an issue:** Describe the feature you would like to see, why it is useful, and how it should work.
* **Discuss:** Engage in discussion on the issue to refine the implementation design before writing code.

### Submitting Pull Requests
1. **Fork the repository** and create your branch from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Set up local development environments** for both `backend` and `frontend` (see the [README.md](README.md) for details).
3. **Write clean, documented code:** Ensure your code matches the existing style guidelines.
4. **Lints and checks:** Run code formatting before committing:
   - For backend: `black` or `autopep8` formatting.
   - For frontend: `npm run build` to verify TypeScript types compile successfully.
5. **Commit your changes:** Use clear, descriptive commit messages (e.g., `feat: add PDF exporter for repair orders`).
6. **Submit the PR:** Describe what your changes do and reference any related open issues.

## Code Style & Standards

* **Python (Backend):** Follow PEP 8 guidelines. Use type hints for all function arguments and return types.
* **TypeScript (Frontend):** Avoid using `any` wherever possible. Define exact interface types in `src/types/index.ts`.
* **Database migrations:** When making model changes, generate a new migration file via `alembic revision --autogenerate` and commit it.
* **Commit Messages:** We follow basic [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` for new features.
  - `fix:` for bug fixes.
  - `docs:` for documentation updates.
  - `refactor:` for code restructuring.
  - `chore:` for updating dependencies or build configurations.

Thank you for your time and contribution!
