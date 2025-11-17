# 🔄 Server Restart Instructions

## Problem Identified

Your server is running **OLD CODE** and has a **corrupted Next.js build cache**.

### Evidence:

1. ❌ Socket error still shows old `getToken()` code (we changed this to `verify()`)
2. ❌ `Error: Cannot find module './vendor-chunks/next.js'` - Build cache corruption
3. ❌ API routes returning 404 errors
4. ❌ Missing vendor chunks for next-auth

---

## ✅ Solution: Clean Restart

I've already stopped your server and deleted the `.next` cache folder.

### Now Run This Command:

```powershell
npm run dev
```

This will:

1. Rebuild your app with the **new fixed code**
2. Generate fresh vendor chunks
3. Start the server with socket.io fix applied

---

## 🎯 What Should Change

### Before (Current Logs):

```
✗ Socket authentication error: Must pass `req` to JWT getToken()
✗ Error: Cannot find module './vendor-chunks/next.js'
✗ GET /api/auth/session 404
✗ GET /api/projects/.../canvas 404
```

### After (Expected Logs):

```
✓ Socket.io server running
✓ Socket connected: <socket-id>
✓ User joined project: <project-id>
✓ GET /api/auth/session 200
✓ GET /api/projects/.../canvas 200
```

---

## 🧪 Testing After Restart

### 1. Socket.io (Real-time Collaboration)

- ✅ No "Must pass req to JWT" errors in logs
- ✅ Open two browser windows on same canvas
- ✅ Drawing in one appears in the other instantly
- ✅ Browser console shows: "Socket connected"

### 2. Canvas Save

- ✅ Should already work (was working before)
- ✅ POST returns 200 status
- ✅ Data persists in database

### 3. GitHub

- ⚠️ Still need to reconnect your GitHub account
- Error will be clearer now: "Please reconnect your GitHub account"
- Action: Go to Settings → Connect GitHub

---

## 🚨 If Server Won't Start

If you get "port already in use" error:

```powershell
# Force kill all node processes
Get-Process -Name node | Stop-Process -Force

# Wait 3 seconds
Start-Sleep -Seconds 3

# Try again
npm run dev
```

---

## 🔍 Troubleshooting

### Issue: Same errors persist

**Solution:**

```powershell
# Stop server
Ctrl+C

# Clean everything
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Rebuild
npm run dev
```

### Issue: TypeScript errors

**Solution:**

```powershell
# Check server.js has the fix
Get-Content server.js | Select-String "jsonwebtoken"
# Should show: const { verify } = require("jsonwebtoken");

# If not, the file wasn't saved - re-apply fix
```

### Issue: 404 on all routes

**Symptom:** All API routes return 404
**Cause:** Build still corrupted
**Solution:**

```powershell
# Nuclear option - delete everything and reinstall
Remove-Item -Path ".next" -Recurse -Force
npm install
npm run dev
```

---

## 📋 Verification Checklist

After restart, verify:

- [ ] No socket authentication errors in terminal
- [ ] API routes return 200/401/500 (not 404)
- [ ] `/api/auth/session` returns valid response
- [ ] Canvas page loads without "vendor-chunks" errors
- [ ] Browser console shows socket connection
- [ ] Drawing on canvas saves successfully

---

## 🎉 Success Indicators

You'll know it worked when you see:

```
✓ Ready on http://localhost:3000
✓ Socket.io server running
✓ Compiled /projects/[projectId]/canvas
✓ GET /api/auth/session 200
✓ Socket connected: <id>
```

And NO MORE:

```
✗ Socket authentication error: Must pass `req` to JWT getToken()
✗ Cannot find module './vendor-chunks/next.js'
```

---

## 🔗 Related Documentation

- **FIXES-SUMMARY.md** - Overview of all fixes
- **docs/SOCKET-GITHUB-FIXES.md** - Technical details

---

**Ready to go! Just run `npm run dev` now.** 🚀
