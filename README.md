# Capstone Project

Description
-----------

This repository contains the final capstone project: a full-stack group-buy recommendation and dashboard application with a Python backend (Flask) and a React frontend. The project includes data preprocessing and machine learning models for recommendations, an admin dashboard, and trader/user interfaces.

Repository
----------

GitHub: https://github.com/1772hojaz/capstone

Quick links
-----------

- Google Colab (notebook / demo): https://colab.research.google.com/drive/1aQHusbRqE0p9XRAUgaSX2bhqjjkr-0w6#scrollTo=86a458d3
- Video demo (Vimeo): https://vimeo.com/1125306747?share=copy

How to set up the environment and the project
---------------------------------------------

Prerequisites

- Python 3.10+ (project code uses Python 3.12 bytecode in __pycache__ but is compatible with 3.10+)
- Node.js 16+ and npm (for the frontend)
- git

Backend (Python)

1. Create and activate a virtual environment:

   python -m venv .venv
   source .venv/bin/activate
2. Install backend requirements:

   pip install -r sys/backend/requirements.txt
3. Initialize or reset the database (SQLite used in repo):

   python sys/backend/init_db.py
4. (Optional) Seed demo data:

   python sys/backend/seed_mbare_data.py
5. Run the backend server:

   python sys/backend/main.py

Frontend (React)

1. Install dependencies and build/start the frontend:

   cd sys/frontend
   npm install
   npm run build   # or `npm start` for dev server
2. The built frontend is in `sys/frontend/build`. In production the backend can serve the static files from this folder (already wired in the repo).

Designs
-------
FIGMA

https://www.figma.com/community/file/1558219458205810998 

Included design artifacts and screenshots (stored in `docs/assets/`):

- Figma mockups (link or embed) — add Figma URL here
- Circuit diagram (if any hardware was used) — add file or link

Screenshots

The following screenshots are included in `docs/assets/`:

![Screenshot 1](docs/assets/Screenshot%20from%202025-10-09%2022-59-21.png)

![Screenshot 2](docs/assets/Screenshot%20from%202025-10-09%2022-59-55.png)

![Screenshot 3](docs/assets/Screenshot%20from%202025-10-09%2023-00-06.png)

![Screenshot 4](docs/assets/Screenshot%20from%202025-10-09%2023-00-24.png)

![Screenshot 5](docs/assets/Screenshot%20from%202025-10-09%2023-00-32.png)

![Screenshot 6](docs/assets/Screenshot%20from%202025-10-09%2023-00-44.png)

![Screenshot 7](docs/assets/Screenshot%20from%202025-10-09%2023-01-06.png)

![Screenshot 8](docs/assets/Screenshot%20from%202025-10-09%2023-01-33.png)

![Screenshot 9](docs/assets/Screenshot%20from%202025-10-09%2023-01-41.png)

![Screenshot 10](docs/assets/Screenshot%20from%202025-10-09%2023-01-48.png)

![Screenshot 11](docs/assets/Screenshot%20from%202025-10-09%2023-01-52.png)

![Screenshot 12](docs/assets/Screenshot%20from%202025-10-09%2023-01-58.png)

![Screenshot 13](docs/assets/Screenshot%20from%202025-10-09%2023-02-03.png)

Deployment plan
---------------

A simple production deployment plan:

1. Prepare a Linux server (Ubuntu 22.04 LTS recommended) with Python 3.10+, Node.js, and nginx.
2. Clone the repository and create a Python virtualenv.
3. Install backend requirements and build the frontend (npm run build).
4. Configure the backend to run under a process manager (systemd or gunicorn + supervisor). Example with systemd:

   - Create a systemd service to run `python sys/backend/main.py` (or use gunicorn to serve the Flask app).
   - Place the frontend build in a directory served by nginx or let the backend serve static files.
5. Configure nginx as a reverse proxy to the backend API and to serve static files. Add TLS via Let's Encrypt.
6. Set up regular backups for the SQLite DB or migrate to PostgreSQL for production.
7. Monitor with logs and a basic health-check endpoint.

Video Demo
----------

Watch the demo video on Vimeo:

https://vimeo.com/1125306747?share=copy

Google Colab
------------

Interactive Colab notebook:

https://colab.research.google.com/drive/1aQHusbRqE0p9XRAUgaSX2bhqjjkr-0w6#scrollTo=86a458d3
