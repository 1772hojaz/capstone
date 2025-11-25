# 🎭 Mock Data Guide - Front-End Development

## 📋 Overview

The ConnectSphere front-end now supports **mock data mode** for development without requiring the backend to be running. This allows you to:

- ✅ Develop and test UI components independently
- ✅ Test user flows without API dependencies
- ✅ Work on front-end when backend is down
- ✅ Demo the app without full infrastructure
- ✅ Faster development iteration

---

## 🔧 How to Toggle Mock Data

### **Enable Mock Data** (Default)

**File:** `sys/Front-end/connectsphere/src/services/apiWithMock.ts`

```typescript
// Line 11
export const USE_MOCK_DATA = true;  // ✅ Using mock data
```

### **Disable Mock Data** (Use Real Backend)

```typescript
// Line 11
export const USE_MOCK_DATA = false;  // ✅ Using real API
```

**That's it!** The entire app will automatically switch between mock and real data.

---

## 📊 What's Included in Mock Data

### **1. Mock Groups** (8 sample groups)
- Premium Arabica Coffee Beans
- Organic Quinoa
- Fresh Avocados
- Premium Olive Oil
- Whole Chicken - Free Range
- Organic Tomatoes
- Artisan Bread Assortment
- Fresh Salmon Fillets

### **2. Mock User**
```javascript
{
  id: 1,
  email: "trader@connectsphere.com",
  full_name: "John Trader",
  location_zone: "Harare",
  preferred_categories: ["Beverages", "Fruits", "Meat & Poultry"],
  budget_range: "medium",
  experience_level: "intermediate"
}
```

### **3. Mock My Groups**
- 3 groups you've joined
- Mixed statuses (active, ready_for_pickup)
- With quantity and payment info

### **4. Mock Recommendations**
- AI-powered recommendations sorted by match %
- Match scores from 75% to 95%
- Includes savings factors

---

## 🎯 Features That Work with Mock Data

| Feature | Status | Notes |
|---------|--------|-------|
| **Login** | ✅ | Returns mock user + token |
| **Register** | ✅ | Returns mock user + token |
| **Logout** | ✅ | Clears token |
| **Dashboard** | ✅ | Shows 8 recommendations |
| **Browse Groups** | ✅ | Shows all 8 groups |
| **Search** | ✅ | Searches mock data |
| **Filter** | ✅ | Filters mock categories |
| **Group Detail** | ✅ | Shows full group info |
| **Join Group** | ✅ | Returns mock payment link |
| **My Groups** | ✅ | Shows 3 joined groups |
| **Payment Init** | ✅ | Returns mock payment URL |
| **Profile Update** | ✅ | Returns updated mock user |

---

## 🎨 Visual Indicator

When mock data is enabled, you'll see a **yellow indicator** on the page:

```
┌──────────────────────┐
│ 💾 MOCK DATA MODE    │
└──────────────────────┘
```

**Location:**
- **Desktop:** Top-right corner
- **Mobile:** Bottom-left corner

---

## 📝 Mock Data Files

### **Main Files:**

1. **`mockData.ts`** - All mock data definitions
   - Mock groups
   - Mock user
   - Mock recommendations
   - Helper functions

2. **`apiWithMock.ts`** - API wrapper with mock support
   - Toggle flag (USE_MOCK_DATA)
   - Mock implementations
   - Fallback to real API

3. **`MockDataIndicator.tsx`** - Visual indicator component

---

## 🔄 How It Works

### **Architecture:**

```
Component → apiWithMock → [Mock Data OR Real API]
                 ↓
          USE_MOCK_DATA?
                 ↓
        YES ↙        ↘ NO
   mockData.ts    api.js (real)
```

### **Request Flow with Mock Data:**

```typescript
// Component calls API
apiService.getRecommendations()
  ↓
// apiWithMock checks flag
if (USE_MOCK_DATA) {
  ↓
  // Simulate delay (feels real!)
  await simulateDelay(600ms)
  ↓
  // Return mock data
  return mockData.recommendations
}
```

---

## 🎭 Simulated Features

### **Realistic Delays:**
Mock data includes simulated network delays to make the experience realistic:

| Operation | Delay |
|-----------|-------|
| Get Groups | 500ms |
| Get Recommendations | 600ms |
| Login | 800ms |
| Join Group | 800ms |
| Payment Init | 1000ms |
| Search | 300ms |

### **Console Logging:**
Mock mode logs all operations to console:

```javascript
📊 Using mock recommendations data
📊 Using mock groups data
📊 Mock: Joining group 1 with data: {...}
💳 Mock: Initializing payment
```

---

## 🛠️ Customizing Mock Data

### **Add More Groups:**

Edit `sys/Front-end/connectsphere/src/services/mockData.ts`:

```typescript
export const mockGroups: MockGroup[] = [
  // ... existing groups
  {
    id: 9,
    name: "Your New Product",
    description: "Product description",
    category: "Category Name",
    price: 29.99,
    // ... other fields
  }
];
```

### **Change User Data:**

```typescript
export const mockUser = {
  id: 1,
  email: "your.email@example.com",
  full_name: "Your Name",
  // ... customize as needed
};
```

### **Adjust Delays:**

```typescript
// In apiWithMock.ts, change the delay values:
await simulateDelay(300);  // Make it faster/slower
```

---

## 🧪 Testing Scenarios

### **Test Empty States:**

```typescript
// Temporarily return empty arrays in mockData.ts
export const mockGroups: MockGroup[] = [];
```

### **Test Loading States:**

```typescript
// Increase delays in apiWithMock.ts
await simulateDelay(5000);  // 5 second delay
```

### **Test Error States:**

```typescript
// In apiWithMock.ts, throw errors:
async getRecommendations() {
  if (USE_MOCK_DATA) {
    await simulateDelay(500);
    throw new Error('Mock error: Failed to load');
  }
  // ...
}
```

---

## 🔄 Switching to Real Backend

### **Step 1:** Change the flag

```typescript
// In apiWithMock.ts
export const USE_MOCK_DATA = false;
```

### **Step 2:** Ensure backend is running

```bash
cd sys/backend
python main.py
```

### **Step 3:** Verify API URL

```typescript
// In api.js
const API_BASE_URL = 'http://localhost:8000';
```

### **Step 4:** Test

Start the frontend and verify real API calls work!

---

## 📋 Checklist for Production

Before deploying to production:

- [ ] Set `USE_MOCK_DATA = false`
- [ ] Test all API endpoints with real backend
- [ ] Remove or comment out MockDataIndicator
- [ ] Verify authentication works
- [ ] Test payment flow end-to-end
- [ ] Check error handling with real errors

---

## 🐛 Troubleshooting

### **Mock data not showing:**

1. Check `USE_MOCK_DATA` is `true`
2. Clear browser cache
3. Check console for errors
4. Verify imports use `apiWithMock` not `api`

### **Real API not working:**

1. Check `USE_MOCK_DATA` is `false`
2. Verify backend is running
3. Check API_BASE_URL is correct
4. Check network tab in DevTools

### **Mock data out of date:**

1. Update `mockData.ts` with new fields
2. Match the structure of real API responses
3. Add TypeScript types if needed

---

## 💡 Best Practices

### **Do:**
- ✅ Use mock data for UI development
- ✅ Keep mock data realistic
- ✅ Update mock data when API changes
- ✅ Test with both mock and real data
- ✅ Use console logs to debug

### **Don't:**
- ❌ Commit with mock mode enabled
- ❌ Deploy to production with mock data
- ❌ Ignore API changes in mock data
- ❌ Test payment with real money in mock mode

---

## 🎯 Current Pages Using Mock Data

When `USE_MOCK_DATA = true`, these pages work without backend:

1. ✅ **TraderDashboard** (`/trader`)
2. ✅ **AllGroups** (`/all-groups`)
3. ✅ **GroupDetail** (`/group/:id`)
4. ✅ **GroupList** (`/groups`)
5. ✅ **Login** (`/login`)
6. ✅ **Register** (`/register`)

---

## 📈 Benefits

### **For Developers:**
- Faster development cycle
- No backend dependency
- Easy to test edge cases
- Consistent test data

### **For Testing:**
- Predictable data
- Easy to reproduce issues
- No database cleanup needed
- Test without API limits

### **For Demos:**
- Works offline
- No backend setup needed
- Consistent demo experience
- Fast loading times

---

## 🚀 Quick Start

### **1. Enable Mock Data**

```typescript
// apiWithMock.ts
export const USE_MOCK_DATA = true;
```

### **2. Start Frontend**

```bash
cd sys/Front-end/connectsphere
npm run dev
```

### **3. Test the App**

```
Open: http://localhost:5173
Login with any credentials (mock mode)
Browse and interact with groups
Everything works without backend! ✨
```

---

## 📞 Need Help?

If you encounter issues with mock data:

1. Check console for mock data logs
2. Verify `USE_MOCK_DATA` flag
3. Check imports use `apiWithMock`
4. Review `mockData.ts` structure
5. Compare with real API responses

---

**Last Updated:** November 18, 2024  
**Version:** 1.0  
**Status:** ✅ Ready to Use

*Happy Development! 🎉*

