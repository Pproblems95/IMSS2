# Quick Start Guide - IMSS Medical App

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- PostgreSQL running with database `imss_medical`
- Ports 4000 (backend) and 5173 (frontend) available

### Start Servers

#### Terminal 1 - Backend
```bash
cd backend
npm install  # Only needed first time
npm run dev
# Expected output: "IMSS backend listening on port 4000"
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm install  # Only needed first time
npm run dev
# Expected output: "VITE v4.5.14 ready in ... Local: http://localhost:5173/"
```

## 🌐 Access the App

Open browser: **http://localhost:5173/**

## 📋 User Journey

### 1. Register New Account
1. Click "Crear Nueva Cuenta"
2. Fill in:
   - Email: your.email@example.com
   - CURP: ABC123456789123456 (optional)
   - Password: min 6 characters
   - Confirm Password: must match
3. Click "Registrar"
4. Auto-login to main menu

### 2. Login
1. Enter email and password
2. Click "Iniciar Sesión"
3. Access main menu

### 3. Book Appointment
1. Click "Agendar Cita"
2. Answer 5 triage questions (0-3 scale)
3. Select specialty
4. Click "Agendar Cita"
5. See confirmation with doctor & time
6. Auto-return to menu after 3 seconds

### 4. View Appointments
1. Click "Mis Citas"
2. See list of appointments
3. Click any card to view details
4. Click "Cancelar Cita" to cancel (if applicable)

## 🎨 UI Features

### Colors
- **Green**: #27ae60 (buttons, headers, accents)
- **White**: #ffffff (backgrounds)
- **Gray**: #ecf0f1 (sections)
- **Red**: #e74c3c (errors, danger)

### Responsive
- **Mobile**: 1-column layout
- **Tablet**: 2-column layout
- **Desktop**: 4-column grid

## 🔧 Common Tasks

### Clear Login (Start Fresh)
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Check Backend Connection
```bash
# In PowerShell:
curl http://localhost:4000/api/health
```

### View Frontend Build
```bash
cd frontend
npm run build
npm run preview
```

### Run Tests
```bash
cd backend
npm test
```

## 📁 Project Structure

```
project/
├── backend/          # Express API server
│   ├── src/
│   │   ├── api/      # Controllers & routes
│   │   ├── db/       # Database migrations
│   │   ├── models/   # Data models
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utilities
│   └── package.json
│
├── frontend/         # React app
│   ├── src/
│   │   ├── contexts/ # AuthContext
│   │   ├── screens/  # Page components
│   │   └── styles/   # CSS files
│   └── package.json
│
└── specs/            # Documentation
    └── 001-imss-medical-app/
        ├── tasks.md
        ├── plan.md
        └── data-model.md
```

## 🔑 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Appointments
```
POST /api/appointments              # Book new
GET /api/appointments               # List user's
GET /api/appointments/:id           # Get one
DELETE /api/appointments/:id        # Cancel
```

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4000
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process

# Kill process on port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### Database Connection Error
1. Ensure PostgreSQL is running
2. Check DB password in `.env`
3. Verify database `imss_medical` exists
4. Run migrations: `npm run migrate` in backend

### Blank Page on Frontend
1. Check browser console (F12)
2. Check if backend is running: `curl http://localhost:4000/api/health`
3. Clear browser cache: Ctrl+Shift+Delete
4. Restart dev server

### API Errors
1. Check backend console for errors
2. Verify Authorization header with token
3. Check request/response in Network tab (F12)
4. Verify backend migrations: `npm run migrate`

## 📊 Test Scenarios

### Happy Path (New User)
1. Register → Book Appointment → View Appointments → Logout

### Login Flow
1. Login → Check saved appointments → Logout → Login again

### Error Handling
1. Wrong password → See error
2. Mismatched passwords → See validation
3. Invalid email → See error
4. Network down → See error message

## 💡 Tips

- Passwords must be **6+ characters**
- CURP is **optional** on signup
- Triage answers are **0-3 scale** (0=no, 3=severe)
- Urgency is **auto-calculated** from triage
- Doctor is **auto-assigned** based on availability
- Appointments can only be **canceled** if BOOKED
- Tokens persist in **localStorage** (survives refresh)
- All **dates shown in local timezone**

## 🎓 Learning Resources

- See `FRONTEND_SETUP_SUMMARY.md` for architecture
- See `TESTING_CHECKLIST.md` for test scenarios
- Check `specs/001-imss-medical-app/` for requirements
- Backend code in `backend/src/` for API logic

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Security Notes

- JWTs stored in localStorage
- All API calls use Authorization header
- Passwords hashed with bcrypt
- HTTPS recommended for production
- CORS configured for localhost:5173

## 📞 Support

For issues:
1. Check browser console (F12) for errors
2. Check backend terminal for API errors
3. Verify both servers running on correct ports
4. Review documentation in `specs/` folder

---

**Happy Testing!** 🎉

Start at: http://localhost:5173/
