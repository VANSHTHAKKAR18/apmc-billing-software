# APMC Unjha - Commission Billing Software
# એ.પી.એમ.સી. ઊંઝા - કમિશન બિલિંગ સોફ્ટવેર

A premium, offline-first desktop billing application built for APMC Unjha commission agents (આડતિયા). Designed for Jeera and agricultural commodity trading with full bilingual (English/Gujarati) support.

![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-Private-red)

---

## ✨ Features

- 📋 **Multi-Product Invoice Generation** — Add multiple products (Jeera, Wheat, etc.) per bill with individual weight, rate & amount
- 🧾 **Traditional APMC-Style Bills** — Professional invoice layout with bilingual English/Gujarati labels
- 🖨️ **Print & PDF Export** — One-click print or save as PDF directly from the app
- 📊 **Dashboard & Reports** — Visual analytics with daily/monthly summaries, top parties, and product breakdowns
- 👥 **Party Management** — Full CRUD for farmers/traders with contact details and transaction history
- 🔐 **PIN-Based Security** — Secure admin access with auto-lock after 15 minutes of inactivity
- 🌐 **Bilingual UI** — Complete English and Gujarati language toggle
- 💾 **Offline-First** — All data stored locally via SQLite, no internet required
- ⚡ **Standalone Desktop App** — Single `.exe` installer for Windows, zero setup required

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Desktop | Electron 33 |
| Database | better-sqlite3 |
| Build | Vite 6, electron-builder |
| Icons | Lucide React |
| Charts | Recharts |

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/apmc-billing-software.git
cd apmc-billing-software

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Build for Production

```bash
# Build the renderer
npm run build

# Package as Windows installer (.exe)
npm run dist
```

The installer will be generated in the `release/` directory.

## 📁 Project Structure

```
apmc-billing-software/
├── electron/           # Electron main process
│   ├── main.js         # App entry, window management
│   └── database.js     # SQLite database layer
├── src/
│   ├── components/     # React UI components
│   │   ├── Billing.jsx       # Invoice creation form
│   │   ├── InvoiceList.jsx   # Invoice list & PDF generation
│   │   ├── Dashboard.jsx     # Analytics dashboard
│   │   ├── PartyManager.jsx  # Party/farmer CRUD
│   │   ├── Reports.jsx       # Financial reports
│   │   ├── Settings.jsx      # App settings
│   │   └── PinLogin.jsx      # PIN authentication
│   ├── contexts/
│   │   └── AppContext.jsx    # Global state management
│   └── utils/
│       └── helpers.js        # Labels, formatters, utilities
├── public/             # Static assets
├── server.js           # Standalone HTTP server (fallback)
├── APMC-Billing.bat    # Quick-launch script
└── package.json
```

## 📄 Invoice Workflow

1. Select a **Party** (farmer/trader)
2. Add one or more **Products** with Weight (KG) and Rate (₹/KG)
3. Enter **Transport**, **Expenses**, and **Commission %**
4. System calculates: `Sale Amount - Transport - Expenses - Commission = Final Payable`
5. **Save** → **Print/PDF** the professional bilingual invoice

## 🔧 Configuration

The app supports configuration through the Settings panel:
- **Language**: Toggle between English and Gujarati
- **Default Commission %**: Set default commission rate
- **Auto-Lock**: Configure auto-lock timeout (default: 15 min)
- **Theme**: Dark mode (default)

## 📝 License

This software is proprietary and developed for private use by APMC Unjha commission agents.

---

**Built for APMC Unjha Traders**
