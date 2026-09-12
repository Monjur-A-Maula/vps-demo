# VPS Demo — Multi-Tenant Web App & Deployment Guide

A production-ready full-stack web application featuring a **Next.js** frontend and a **Node.js/Express** backend deployed on a shared Ubuntu VPS with **Nginx Reverse Proxy**, **PM2 Process Manager**, **Dockerized MySQL**, and **GitHub Actions CI/CD**.

---

## 🏗️ System Architecture

Following standard Reverse Proxy Architecture (CSE 3100):

```txt
┌────────────────────────────────────────────────────────┐
│             Client Web Browser (Users)                │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTP Port 80)
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy                   │
│   (/etc/nginx/sites-available/<VPS_USER>.conf)         │
│  - Routes /<VPS_USER>/vps-demo      ➜ Frontend (3060)  │
│  - Routes /<VPS_USER>/vps-demo/api/ ➜ Backend  (4060)  │
└──────────┬─────────────────────────────────┬───────────┘
           │ (Reverse Proxy: 3060)           │ (Reverse Proxy: 4060)
           ▼                                 ▼
┌───────────────────────┐         ┌────────────────────────┐
│  Next.js App Server   │         │   Node.js API Server   │
│  (Port 3060 - PM2)    │         │   (Port 4060 - PM2)    │
└───────────────────────┘         └───────────┬────────────┘
                                              │ (TCP: 127.0.0.1:3307)
                                              ▼
                                  ┌────────────────────────┐
                                  │     MySQL Database     │
                                  │ (Docker: mysql-database│
                                  └────────────────────────┘
```

---

## 📁 Project Structure

```txt
vps-demo/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # Automated CI/CD deployment pipeline
├── backend/
│   ├── package.json           # Node.js backend configuration
│   └── server.js              # HTTP health & API service
├── frontend/
│   ├── next.config.ts         # Next.js config with basePath
│   ├── package.json           # Next.js 16 + React 19 dependencies
│   └── src/
│       └── app/
│           └── page.tsx       # Landing page with API integration button
├── .env.example               # Environment variables template
└── README.md                  # Comprehensive documentation & setup guide
```

---

## 💻 Local Development

### 1. Clone and Install Dependencies

```bash
git clone YOUR_GITHUB_REPO_URL vps-demo
cd vps-demo

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install --prefix backend
npm install --prefix frontend
```

### 2. Run Locally

* **Start Backend:**
  ```bash
  npm --prefix backend run dev
  ```
  Backend runs at: `http://localhost:4060`

* **Start Frontend:**
  ```bash
  npm --prefix frontend run dev
  ```
  Frontend runs at: `http://localhost:3060/<NEXT_PUBLIC_BASE_PATH>`

---

## 🚀 Shared VPS Deployment Guide

### Step 1: Clone and Set Up on VPS

SSH into the VPS server:
```bash
ssh <VPS_USER>@<VPS_HOST>
```

Clone the repository and set up `.env`:
```bash
cd /home/<VPS_USER>
git clone YOUR_GITHUB_REPO_URL vps-demo
ln -sf /home/<VPS_USER>/vps-demo /home/<VPS_USER>/bookapi
cd /home/<VPS_USER>/vps-demo

# Create .env file inside vps-demo (checked directly by Exam Console via symlink)
cat << "EOF" > .env
PORT=4060
FRONTEND_PORT=3060
BACKEND_PORT=4060
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=<VPS_USER>
DB_USER=<VPS_USER>
DB_PASSWORD=your_mysql_password
NEXT_PUBLIC_BASE_PATH=/<VPS_USER>/vps-demo
EOF

# ---------------------------------------------------------
# Note: DO NOT manually create the `deploy` folder, 
# build the project, or start PM2. 
# GitHub Actions (.github/workflows/ci-cd.yml) 
# will handle all of that automatically on every push!
# ---------------------------------------------------------
```

---

### Step 3: Configure Nginx (Multi-Project Ready)

Create `/etc/nginx/sites-available/<VPS_USER>.conf`:

```bash
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/<VPS_USER>.conf
server {
    listen 80;
    server_name <VPS_USER>.local <VPS_USER>.test;

    # Project: vps-demo Backend API
    location /<VPS_USER>/vps-demo/api/ {
        proxy_pass http://127.0.0.1:4060/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Project: vps-demo Frontend Next.js
    location /<VPS_USER>/vps-demo {
        proxy_pass http://127.0.0.1:3060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF'

# Enable the configuration
sudo ln -sf /etc/nginx/sites-available/<VPS_USER>.conf /etc/nginx/sites-enabled/

# Test syntax and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🌐 Browser Access (Local DNS Setup)

Because `.test` is a virtual local test domain, configure your client computer's `hosts` file to resolve `<VPS_USER>.test` to `<VPS_HOST>`.

### Windows Setup:
Open **PowerShell (Run as Administrator)**:
```powershell
Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "`n<VPS_HOST> <VPS_USER>.test <VPS_USER>.local"
```

### macOS / Linux Setup:
```bash
echo "<VPS_HOST> <VPS_USER>.test <VPS_USER>.local" | sudo tee -a /etc/hosts
```

### Live URLs:
* **Frontend:** `http://<VPS_USER>.test/<VPS_USER>/vps-demo`
* **Backend API / Health:** `http://<VPS_USER>.test/<VPS_USER>/vps-demo/api/`

---

## 🔄 Automated CI/CD (GitHub Actions)

This repository includes a fully automated deployment pipeline in `.github/workflows/ci-cd.yml`.

### Required GitHub Secrets
Go to: `Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret`

| Secret Key | Example Value | Purpose |
| :--- | :--- | :--- |
| `VPS_HOST` | `<your_vps_ip_or_host>` | Remote VPS server IP / hostname |
| `VPS_USER` | `<your_vps_username>` | SSH login username |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH...` | Private SSH key |
| `VPS_PORT` | `22` | SSH port (defaults to 22) |
| `VPS_APP_DIR`| `/home/<your_vps_username>/vps-demo` | Target directory on VPS |
| `FRONTEND_PORT` | `3060` | PM2 Frontend port |
| `BACKEND_PORT` | `4060` | PM2 Backend port |
| `NEXT_PUBLIC_BASE_PATH` | `/<your_vps_username>/vps-demo` | App base path |
| `PM2_APP_SUFFIX` | `<your_vps_username>-vps-demo` | PM2 naming prefix |

Every `git push origin main` triggers automatic test builds, code pull, dependency sync, build, and zero-downtime PM2 restart on the VPS!

---

## 🎯 Exam Console Compliance Checklist

To ensure **100% PASS** on the **CSE 3100 Exam Console**:

- [x] **Environment File:** `.env` contains `PORT=4060`, `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_NAME=<VPS_USER>`, `DB_USER=<VPS_USER>`.
- [x] **Health Check:** `http://localhost:4060/` returns JSON with `status: "ok"` and `database: "up"`.
- [x] **PM2 Processes:** `backend-<VPS_USER>-vps-demo` and `frontend-<VPS_USER>-vps-demo` online.
- [x] **Deployment Artifact:** `/home/<VPS_USER>/deploy` contains `.env`, `server.js`, and `package.json`.
- [x] **BookAPI Symlink:** `/home/<VPS_USER>/bookapi` links to `/home/<VPS_USER>/vps-demo`.
- [x] **MySQL Scoped Grants:** `<VPS_USER>@%` granted on `<VPS_USER>.*` inside `mysql-database`.
- [x] **Nginx Config:** `/etc/nginx/sites-available/<VPS_USER>.conf` enabled with `<VPS_USER>.test`.

---

## 🛠️ Complete Server & Linux Cheat Sheet

### 🚀 Process Management (PM2)
* `pm2 list` — View all running apps, their RAM/CPU usage, and status.
* `pm2 logs` — View live logs for your apps (crucial for finding errors).
* `pm2 restart all` — Restart all apps (required after code updates or `.env` changes).
* `pm2 stop <app_name>` — Temporarily stop a specific app.
* `pm2 delete all` — Delete all apps from PM2 tracking.
* `pm2 save` — Save the current list of running apps to auto-start on reboot.

### 🌐 Web Server (Nginx)
* `sudo nginx -t` — Check Nginx configuration for syntax errors.
* `sudo systemctl reload nginx` — Apply changes without dropping active users.
* `sudo systemctl restart nginx` — Completely restart the Nginx server.
* `sudo systemctl status nginx` — Check Nginx health and status.
* `cat /var/log/nginx/error.log` — View Nginx error logs (e.g., for 502 Bad Gateway).

### 📂 File & Folder Management
* `cp <file> <dest>` — Copy a file. (Use `cp -r` to copy folders).
* `mv <file> <dest>` — Move or rename a file/folder.
* `rm <file>` — Delete a file. (Use `rm -rf <folder>` to force delete a folder).
* `mkdir <folder>` — Create a new directory.
* `ls -la` — List all files and folders, including hidden ones (like `.env` or `.git`).
* `pwd` — Print your current working directory path.

### 🖥️ Server Monitoring
* `htop` or `top` — Live task manager to view CPU and RAM usage by process.
* `free -m` — Check available RAM in Megabytes.
* `df -h` — Check available Hard Disk (Storage) space.

### 🔌 Network & Ports
* `curl http://localhost:4060` — Test if your app is responding locally.
* `ping google.com` — Check if the server has active internet access.
* `sudo ufw status` — Check the server firewall status (open/closed ports).

### 🔑 Common Issues & Troubleshooting
1. **"502 Bad Gateway" on browser:**
   * Your backend or frontend has crashed. Run `pm2 logs` to see what error Node.js is throwing.
2. **"Database Connection Refused":**
   * Check your `.env` file (`cat .env`). Ensure `DB_PORT` is `3307` and `DB_PASSWORD` is correct.
3. **App not updating after git pull:**
   * You must run `npm run build` in the frontend again, and then `pm2 restart all`.
