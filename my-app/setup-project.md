# HenzCorp Cryptocurrency Mobile App - Setup Guide

## 🚀 Quick Setup Instructions

### Step 1: Create New Vite Project
```bash
npm create vite@latest henzcorp-app -- --template react-ts
cd henzcorp-app
```

### Step 2: Install Dependencies
```bash
npm install
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind CSS
Replace the content of `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Step 4: Update src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 5: Update index.html title
Change the title to: `HenzCorp Cryptocurrency Mobile App`

### Step 6: Copy Source Files
You'll need to copy these files from the project:

**Main Files:**
- `src/App.tsx` - Main application component
- `src/main.tsx` - Entry point
- `src/lib/supabase.ts` - Mock data and API functions

**Hooks:**
- `src/hooks/useAuth.ts` - Authentication management
- `src/hooks/useWallets.ts` - Wallet management
- `src/hooks/useTransactions.ts` - Transaction management

**Components (create src/components/ folder):**
- `src/components/LoginScreen.tsx`
- `src/components/SignupScreen.tsx`
- `src/components/DepositScreen.tsx`
- `src/components/WithdrawScreen.tsx`
- `src/components/AirtimeScreen.tsx`
- `src/components/BuyCryptoScreen.tsx`
- `src/components/TransferScreen.tsx`
- `src/components/ReferralScreen.tsx`
- `src/components/AccountScreen.tsx`

### Step 7: Run the Project
```bash
npm run dev
```

## 📱 Features Included

✅ **Complete Mobile UI** - Responsive design optimized for mobile
✅ **Authentication System** - Login/Signup with mock data
✅ **Multi-Currency Wallets** - UGX, BTC, ETH, LTC, USDT support
✅ **Deposit & Withdrawal** - MTN Money, Airtel Money, Bank Transfer
✅ **Cryptocurrency Trading** - Buy/Sell crypto with real-time prices
✅ **Airtime Purchases** - MTN, Airtel, UTL network support
✅ **Transfer System** - Internal and external transfers
✅ **Referral Program** - Complete referral system with earnings
✅ **Transaction History** - Comprehensive transaction tracking
✅ **Account Management** - Profile settings and security

## 🎨 Design Features

- **Modern Gradient UI** - Beautiful blue/purple gradients
- **Glass Morphism Effects** - Backdrop blur and transparency
- **Smooth Animations** - Loading states and transitions
- **Mobile-First Design** - Optimized for mobile devices
- **Dark Theme** - Professional dark color scheme
- **Lucide Icons** - Clean, modern iconography

## 🔧 Technical Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Mock Data System** - No database required
- **Responsive Design** - Works on all screen sizes

## 📊 Mock Data Included

- **Sample User**: John Doe (verified account)
- **Wallet Balances**: UGX 950,000, 0.01 BTC, 0.5 ETH
- **Transaction History**: Deposits, trades, airtime purchases
- **Crypto Prices**: Real-time mock prices for all supported coins
- **Referral Data**: Sample referral statistics and earnings

## 🚀 Ready to Use

The app is fully functional with mock data - no backend setup required! Perfect for:
- **Prototyping** - Demonstrate cryptocurrency app features
- **Development** - Build and test new features
- **Presentation** - Show complete mobile banking solution
- **Learning** - Study modern React/TypeScript patterns

Start developing immediately with `npm run dev`!