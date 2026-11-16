# KM Stonex Khata 🏛️
### Marble, Granite & Stone Business Ledger with Multi-Party Payment Pass-Through Engine

**KM Stonex Khata** is a full-stack financial ledger application built with **React (Vite + Tailwind CSS)** and **Node.js / Express + MongoDB (Mongoose)**, designed specifically for stone, marble, and granite businesses, suppliers, and traders.

---

## 🌟 Key Features

### 1. Payment Route & Split Engine (The Signature Feature)
* **Real-world Business Scenario:** When customer **Ram** pays you **₹500**, you can immediately route/split that incoming money:
  * Pay **₹300** to **Ambaji Stone Suppliers** (reduces what KM Stonex owes Ambaji).
  * Pay **₹200** to **Makrana Granite Works** (reduces what KM Stonex owes Makrana).
  * Or retain any partial amount as cash in hand / bank.
* **Atomic Execution:** In one single click, Ram's customer dues decrease by ₹500, both suppliers' payables decrease by ₹300 and ₹200, and a permanent linked audit trail is created in all ledgers.

### 2. Double-Entry Khata & Balance Tracking
* **You'll Get (Lena Hai / Receivable):** Outstanding balances owed to you by customers (in green).
* **You'll Give (Dena Hai / Payable):** Amounts you owe to raw block suppliers and quarries (in red).
* **Net Standing:** Real-time surplus or deficit calculations across all books.
* **Party Statements:** Full account ledger with **Running Balance**, date filters, printable statements, and WhatsApp payment reminders.

### 3. Marble & Stone Itemized Entries
* Record sale invoices and purchase bills with optional itemized slab/stone details (Item name, Sq.Ft, Rate, Total).

### 4. Dual-Mode Storage & 100% Zero-Crash Architecture
* **MongoDB Atlas Production Mode:** Automatically connects when you paste your `MONGODB_URI` in `backend/.env`.
* **Local Persistent JSON Mode:** Automatically activates if MongoDB is not yet configured, allowing instant offline use without crashes.
* **1-Click Backup & Restore:** Export complete database snapshots to offline JSON anytime with one click.

---

## 🔒 10-Year Durability & Reliability FAQ

### Question: *"Will data automatically get deleted or erased if I use a MongoDB free plan for 10 years?"*

### Transparent Answer:
1. **If you use the application regularly:**
   * **MongoDB Atlas Free Tier (M0) NEVER deletes your data.**
   * The free tier gives you **512 MB** of cloud storage forever. For text ledger entries (thousands of parties and transactions), 512 MB can hold **200,000 to 500,000+ entries** without filling up.
2. **If you leave it completely unused/untouched for months:**
   * **Inactivity Policy:** If an M0 cluster receives **0 connections for 60 consecutive days**, MongoDB Atlas may temporarily pause the cluster to conserve resources. You can resume it with 1 click from your Atlas dashboard. If abandoned for many months without responding to email alerts, inactive free clusters can eventually be scheduled for deletion.
3. **How KM Stonex Khata guarantees 100% 10-year safety:**
   * **1-Click Backup:** Open the **"Data Safety & Backup Center"** in the app and click **"Download Full Backup"**. Save the file to your PC, external drive, or Google Drive.
   * **Local MongoDB Option:** You can also run a local MongoDB instance on your PC or office laptop (`mongodb://127.0.0.1:27017/km_stonex_khata`). Local databases have zero cloud timeouts, no inactivity policies, and remain for decades as long as your drive exists.
   * **One-Click Restore:** Upload any past backup file anytime to instantly restore all books and records.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```

### 2. Configure MongoDB (Optional)
Open `backend/.env` and set your MongoDB Atlas connection string (or leave empty to run on local persistent storage):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/km_stonex_khata?retryWrites=true&w=majority
```

### 3. Run Concurrently (Frontend + Backend)
Run the root command:
```bash
npm run dev
```

* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 🛠️ Tech Stack
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide React, Axios.
* **Backend:** Node.js, Express, Mongoose (MongoDB ODM), Morgan, CORS, Dotenv.
* **Orchestration:** Concurrently (unified single-command startup).

---

## 📜 API Endpoints
* `GET /api/dashboard` - Financial summary, receivables, payables, cashflows, and DB status.
* `GET /api/parties` - List all parties (customers, suppliers, or both).
* `POST /api/parties` - Add new party with opening balance.
* `POST /api/transactions` - Add standard entry (YOU_GOT, YOU_GAVE, SALE_BILL, PURCHASE_BILL).
* `POST /api/routed-payments` - Execute Receive & Distribute split transfer.
* `GET /api/backup/export` - Download complete database JSON backup.
* `POST /api/backup/restore` - Restore all records from uploaded backup.
* `GET /api/settings` - Business profile & contact details.
