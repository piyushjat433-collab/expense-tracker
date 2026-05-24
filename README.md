# 💰 SpendWise — Expense Tracker with Bank Statement Parser

> **Throne8 Full Stack + React Native Assignment — Task 3**

A full-stack expense tracker that parses PDF bank statements, auto-categorizes transactions using regex/keyword matching, displays interactive spending charts, and generates smart budget alerts.

---

## 🚀 Live Demo

| | Link |
|---|---|
| **Frontend (Vercel)** | [spendwise.vercel.app](https://spendwise.vercel.app) |
| **Backend (Render)** | [spendwise-api.onrender.com](https://spendwise-api.onrender.com/health) |

---

## ✨ Features

- 📄 **PDF Bank Statement Upload** — drag & drop or browse, up to 10MB
- 🔍 **Regex + Keyword Parser** — extracts transactions from HDFC, SBI, ICICI, Axis, Kotak statements
- 🏷️ **Auto-Categorization** — 8 categories: Food, Travel, Shopping, Entertainment, Health, Bills, Education, Transfer
- 📊 **Interactive Charts** — Pie chart + Monthly bar chart powered by Recharts
- ⚠️ **Smart Budget Alerts** — warns when spending exceeds preset limits per category
- 🔎 **Search & Filter** — search by keyword, filter by category or debit/credit
- 🎭 **Demo Mode** — works without any PDF upload (30 pre-loaded transactions)
- 🔒 **Privacy First** — PDFs processed in memory, never stored

---

## 🛠️ Tech Stack

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express | REST API server |
| pdf-parse | PDF text extraction |
| multer | File upload handling |
| helmet + cors | Security middleware |
| express-rate-limit | API rate limiting |

### Frontend
| Tool | Purpose |
|---|---|
| React 18 + Vite | UI framework + bundler |
| Tailwind CSS | Utility-first styling |
| Recharts | Charts (Pie + Bar) |
| Axios | HTTP client |
| Lucide React | Icon library |

---

## 📁 Project Structure

```
throne8-expense-tracker/
├── backend/
│   ├── src/
│   │   ├── index.js               # Express app entry
│   │   ├── routes/
│   │   │   ├── upload.js          # POST /api/upload, GET /api/upload/demo
│   │   │   └── transactions.js    # GET /api/transactions/categories
│   │   ├── services/
│   │   │   ├── pdfParser.js       # PDF extraction + transaction parsing
│   │   │   └── categorizer.js     # Keyword-based categorization + alerts
│   │   └── middleware/
│   │       └── errorHandler.js    # Global error handler
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root — Upload → Dashboard routing
│   │   ├── components/
│   │   │   ├── UploadScreen.jsx   # PDF drag-drop + upload UI
│   │   │   ├── SpendingChart.jsx  # Pie + Bar chart with Recharts
│   │   │   ├── BudgetAlerts.jsx   # Budget overspend alerts
│   │   │   ├── TransactionList.jsx# Searchable, filterable tx list
│   │   │   └── StatsBar.jsx       # Summary stat cards
│   │   ├── pages/
│   │   │   └── Dashboard.jsx      # Main dashboard layout
│   │   └── utils/
│   │       ├── api.js             # Axios API calls
│   │       └── format.js          # INR formatter, date helpers
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/throne8-expense-tracker.git
cd throne8-expense-tracker
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (PORT=5000 by default)
npm run dev
# ✅ Server starts at http://localhost:5000
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
# ✅ App starts at http://localhost:5173
```

### 4. Open the app
Visit **http://localhost:5173** → Click "Try with Demo Statement" to see it in action instantly.

---

## 🌐 Deployment

### Backend → Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo → Set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add env var: `FRONTEND_URL=https://your-app.vercel.app`

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your repo → Set **Root Directory** to `frontend`
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy!

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/upload` | Upload PDF bank statement |
| `GET` | `/api/upload/demo` | Get demo transaction data |
| `GET` | `/api/transactions/categories` | List all categories |

### POST `/api/upload`
```
Content-Type: multipart/form-data
Body: statement (PDF file), budgets (JSON string, optional)

Response:
{
  "success": true,
  "data": {
    "transactions": [...],
    "summary": { "categoryTotals": {...}, "totalSpend": 12000, ... },
    "alerts": [...],
    "meta": { "fileName": "...", "parsedAt": "..." }
  }
}
```

---

## 🏷️ Supported Categories

| Category | Keywords |
|---|---|
| 🍔 Food | Swiggy, Zomato, Dominos, BigBasket, restaurant... |
| ✈️ Travel | Uber, Ola, IRCTC, MakeMyTrip, flight, petrol... |
| 🛍️ Shopping | Amazon, Flipkart, Myntra, DMart... |
| 🎬 Entertainment | Netflix, Hotstar, PVR, BookMyShow, Spotify... |
| 💊 Health | Pharmacy, Apollo, 1mg, gym, hospital... |
| 📄 Bills | Airtel, Jio, electricity, EMI, recharge... |
| 📚 Education | Udemy, BYJU's, Coursera, tuition... |
| 💸 Transfer | NEFT, RTGS, UPI, ATM withdrawal... |

---

## 📸 Screenshots

> *(Add screenshots or demo video here)*

---

## 👤 Author

**Piyush** — React Native Developer Intern Candidate  
[LinkedIn](https://linkedin.com/in/yourprofile) · [GitHub](https://github.com/yourusername)

---

## 📝 License

MIT
