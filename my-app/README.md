# HenzCorp Cryptocurrency Mobile App

A modern, full-featured cryptocurrency mobile application built with React, TypeScript, and Supabase.

## 🚀 Features

### 💰 Financial Operations
- **Multi-Currency Wallets** - Support for UGX, BTC, ETH, LTC, USDT
- **Deposits & Withdrawals** - MTN Money, Airtel Money, Bank Transfer
- **Cryptocurrency Trading** - Buy/Sell crypto with real-time prices
- **Airtime Purchases** - MTN, Airtel, UTL network support
- **Transfer System** - Internal and external transfers

### 👥 User Management
- **Authentication** - Secure login/signup with Supabase Auth
- **User Profiles** - Complete profile management
- **Verification System** - Account verification status
- **Referral Program** - Earn rewards for referrals

### 📊 Advanced Features
- **Real-time Data** - Live balance updates and transaction history
- **Transaction History** - Comprehensive transaction tracking
- **Referral Earnings** - Track and manage referral rewards
- **Security** - Bank-level security with Row Level Security (RLS)

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Secure data access
- **Database Functions** - Custom PostgreSQL functions
- **Real-time Subscriptions** - Live data updates

### Database Schema
- **User Profiles** - User information and verification
- **Wallets** - Multi-currency balance management
- **Transactions** - Complete transaction logging
- **Crypto Assets** - Cryptocurrency market data
- **Referrals** - Referral system and earnings

## 🏗️ Architecture

### Dual Mode System
The app supports two modes:
1. **Mock Data Mode** - For development and testing
2. **Database Mode** - Connected to Supabase PostgreSQL

### Key Components
- **Authentication System** - Secure user management
- **Wallet Management** - Multi-currency support
- **Transaction Processing** - Real-time transaction handling
- **Referral System** - Complete referral tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database mode)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd henzcorp-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

4. **Configure Supabase** (for database mode)
- Create a new Supabase project
- Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Run the development server**
```bash
npm run dev
```

### Database Setup

The app includes pre-configured database migrations in `supabase/migrations/`:

1. **User Management** - User profiles and authentication
2. **Wallet System** - Multi-currency wallet management
3. **Transaction System** - Complete transaction tracking
4. **Crypto Trading** - Cryptocurrency trading system
5. **Airtime System** - Mobile airtime purchases
6. **Referral System** - Referral tracking and rewards

## 📱 Usage

### Mock Data Mode
- Toggle to "Mock" mode using the database toggle
- Use demo account: `demo@henzcorp.com` / `demo123`
- All data is stored in localStorage

### Database Mode
- Toggle to "Database" mode
- Create a new account or login with existing credentials
- All data is stored in Supabase PostgreSQL

### Key Features

#### Deposits
- MTN Mobile Money
- Airtel Money  
- Bank Transfer
- Instant processing

#### Withdrawals
- Multiple withdrawal methods
- Fee calculation
- Secure processing

#### Crypto Trading
- Real-time prices
- Buy/Sell functionality
- Multiple cryptocurrencies
- Trading fees

#### Airtime Purchases
- MTN, Airtel, UTL networks
- Self or others
- Instant delivery

#### Transfers
- Internal transfers (user-to-user)
- External transfers (to external wallets)
- Network fees

#### Referrals
- Unique referral codes
- Earnings tracking
- Reward system

## 🔒 Security

### Authentication
- Supabase Auth integration
- Secure session management
- Password encryption

### Database Security
- Row Level Security (RLS) enabled
- User data isolation
- Secure API endpoints

### Data Protection
- Encrypted data transmission
- Secure localStorage handling
- Input validation and sanitization

## 🎨 Design

### Mobile-First
- Responsive design for all screen sizes
- Touch-friendly interface
- Smooth animations and transitions

### Modern UI
- Glass morphism effects
- Gradient backgrounds
- Clean typography
- Intuitive navigation

### User Experience
- Loading states
- Error handling
- Success feedback
- Smooth transitions

## 📊 Database Schema

### Core Tables
- `user_profiles` - User information
- `wallets` - Multi-currency balances
- `transactions` - Transaction history
- `crypto_assets` - Market data
- `deposits` - Deposit records
- `withdrawals` - Withdrawal records
- `crypto_trades` - Trading history
- `crypto_transfers` - Transfer records
- `airtime_purchases` - Airtime history
- `referrals` - Referral relationships
- `referral_earnings` - Earnings tracking

### Database Functions
- `get_user_balance()` - Get wallet balance
- `update_wallet_balance()` - Update balances
- `get_referral_stats()` - Referral statistics

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
The app is configured for easy Netlify deployment with automatic builds.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

The app includes:
- Automatic data refresh
- Real-time updates
- Error recovery
- Data synchronization

---

**HenzCorp** - Modern Cryptocurrency Banking Solution