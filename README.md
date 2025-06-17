# 👟 GP Fax Footwear Inventory Management System
Introduction & Motivation

This project is a production-ready MERN stack inventory management system developed during my internship at GP Fax Footwear — a fast-growing footwear business aiming to digitize and streamline its operations.

The company previously managed its inventory manually through spreadsheets, which often led to errors, stock mismatches, and order delays. To address this, I was assigned to design and build a comprehensive solution capable of handling real-world footwear inventory complexities — such as variant-based product tracking, real-time stock deduction, chalan (delivery note) generation, and exportable reports for both internal operations and external stakeholders.

This system minimizes manual workload, reduces errors, and provides actionable insights, helping both staff and management operate more efficiently.

It features dynamic article management, automated form logic, stock tracking, chalan workflows, and one-click Excel/PDF exports — all tailored for actual business deployment.
---

## 🚀 Features

### 📝 Article Management
- Add, edit, soft-delete, restore, and permanently delete footwear articles.
- Manage detailed attributes: gender, size, series, pair/crtn, images.
- Auto-suggestions for existing articles and creators.

### ⚙️ Dynamic Form Logic
- Auto-freeze fields (stock type, MRP, series, etc.) based on existing article data.
- Size dropdowns populated from database; manual entry supported for new sizes.
- MRP & rate auto-filled based on size + article combination.
- Gender-based image preview (optional if no image present).

### 📦 Stock & Chalan Handling
- Real-time stock deduction when chalan is generated.
- Prevents chalan/PDF creation for out-of-stock or unknown articles.
- Auto-size and color dropdowns in chalan form based on DB entries.

### 📤 Exports
- Export complete or selected product list to **Excel/PDF**.
- Optional toggle for export **with or without images**.

### 🔍 Filtering & Search
- Main product table supports dropdown filters for all key fields.
- Global search bar for instant lookup across fields.
  
### 🧾 Dashboard & Low Stock Alerts
- Smart dashboard with total articles, available stock, and deleted items.
- **Low-stock articles highlighted in red** for quick identification.

### 🗑️ Soft Delete & Recovery
- Soft delete functionality with restore and **permanent delete** options.
- Deleted items managed in a separate view with recovery controls.

### 🔐 Authentication & Audit Trail
- Simple login system with protected routes.
- Tracks “Created By” user for all new entries.

---

## 🧰 Tech Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Frontend  | React.js, CSS, Bootstrap       |
| Backend   | Node.js, Express.js            |
| Database  | MongoDB (Atlas)                |
| Auth      | JWT-based login                |
| Exports   | ExcelJS, PDFKit                |

---

⚙️ Setup & Installation

**Clone the repository:**


git clone <repo-url>
cd FOOTWEAR-INVENTORY

**Backend Setup:**
bash
cd backend
npm install
# Create .env file with MongoDB URI and JWT secret
npm start

**Frontend Setup:**
bash
cd frontend
npm install
npm start

**Environment Variables:**
Create .env in /backend:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

---
🖼️ Screenshots
Form with auto-freeze fields & image preview :
<img width="689" alt="image" src="https://github.com/user-attachments/assets/99394a2e-c5c9-46f3-b1db-c6ecd84bdf37" />
Main table with filters and search : 
<img width="883" alt="image" src="https://github.com/user-attachments/assets/6a44449a-9daa-4a24-ad06-6f2ba78e8e37" />
Export (Excel) :without images:
<img width="950" alt="image" src="https://github.com/user-attachments/assets/3228770c-25ef-4dbb-b3b4-6681990a3ebc" />
Export (Excel) :with images:
<img width="957" alt="image" src="https://github.com/user-attachments/assets/40b488cc-dd91-4a1d-a71d-246ff85c1522" />
PDF Export : with image : 
<img width="955" alt="image" src="https://github.com/user-attachments/assets/72f462fe-d59a-4a67-8819-2d388465f6df" />
PDF Export : without image :
<img width="950" alt="image" src="https://github.com/user-attachments/assets/193be8e7-01c3-4751-b349-650fb2919327" />
Challan Pdf :
<img width="947" alt="image" src="https://github.com/user-attachments/assets/b7248097-e323-4093-ab3e-542b53aa3210" />

🧪 Future Enhancements :
- Role-based Access Control (Admin/Staff)
- Analytics Dashboard with charts
- Mobile Responsive PWA

👩‍💻 Developed By :
Kajal (Solo Developer)
Based on requirements from the GP Fax Pvt. Ltd. Footwear Company
Built with ❤️ using MERN Stack

📝 License :
This project is proprietary and for internal company use only.

                   


