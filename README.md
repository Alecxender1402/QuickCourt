# QuickCourt 🏸

**QuickCourt** is a comprehensive sports venue booking platform that enables users to discover, book, and manage sports court reservations across multiple venues. The platform provides an intuitive interface for customers to find available courts, make bookings, and manage their reservations, while offering venue owners powerful tools to manage their facilities, time slots, and bookings.

## 🚀 Features

### For Customers
- **Venue Discovery**: Browse and search sports venues by location, sport type, and amenities
- **Real-time Booking**: Check availability and book courts in real-time
- **Multiple Sports**: Support for various sports including Tennis, Badminton, Football, Cricket, Swimming, and Table Tennis
- **User Authentication**: Secure registration, login with OTP verification, and password reset
- **Booking Management**: View, modify, and cancel bookings through a user-friendly dashboard
- **Payment Integration**: Secure payments powered by Stripe
- **Reviews & Ratings**: Rate and review venues and courts
- **Notifications**: Email notifications for booking confirmations and updates

### For Venue Owners
- **Venue Management**: Add and manage multiple sports venues
- **Court Configuration**: Set up courts with pricing, amenities, and capacity
- **Time Slot Management**: Configure operating hours and availability
- **Booking Overview**: Track all bookings and revenue
- **Dynamic Pricing**: Flexible pricing per court and time slot
- **Analytics Dashboard**: Monitor performance and booking trends
- **Photo Management**: Upload and manage venue and court photos

### For Administrators
- **User Management**: Monitor and manage user accounts
- **Venue Approval**: Review and approve new venue submissions
- **Reports & Analytics**: Comprehensive reporting system
- **System Administration**: Manage platform-wide settings and configurations

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **TanStack Query** for state management and API calls
- **React Hook Form** with Zod validation
- **Stripe Elements** for payment processing

### Backend
- **Node.js** with Express.js
- **Prisma ORM** with PostgreSQL database
- **JWT** for authentication
- **Stripe** for payment processing
- **Cloudinary** for image storage
- **Nodemailer** for email services
- **Express Rate Limiting** for API protection
- **Helmet** for security headers

### Database
- **PostgreSQL** as the primary database
- **Prisma** for database migrations and schema management

### DevOps & Tools
- **ESLint** and **Prettier** for code quality
- **Git** for version control
- **Environment-based configuration**

## 📁 Project Structure

```
QuickCourt/
├── backend/                    # Node.js Express API
│   ├── prisma/                # Database schema and migrations
│   │   ├── schema.prisma      # Prisma database schema
│   │   └── migrations/        # Database migrations
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # API route controllers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   └── utils/             # Utility functions
│   ├── scripts/               # Database and setup scripts
│   └── index.js               # Main server entry point
├── frontend/                  # React TypeScript application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   └── index.html             # Main HTML template
└── README.md                  # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **Git**

### Environment Variables

Create `.env` files in both backend and frontend directories:

#### Backend `.env`
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/quickcourt"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Server
PORT=5001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend `.env`
```env
VITE_API_URL="http://localhost:5001"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
```

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Alecxender1402/QuickCourt.git
   cd QuickCourt
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Setup database
   npx prisma generate
   npx prisma db push
   
   # Initialize database with sample data (optional)
   npm run db:init
   
   # Start development server
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   
   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - Prisma Studio: `npx prisma studio` (in backend directory)

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/bookings` - Get user bookings

### Venue Endpoints
- `GET /api/public/venues` - Get all venues
- `GET /api/public/venues/:id` - Get venue details
- `POST /api/venues` - Create venue (Owner)
- `PUT /api/venues/:id` - Update venue (Owner)

### Booking Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Payment Endpoints
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/stripe/webhook` - Stripe webhook handler

## 🗃️ Database Schema

### Core Models
- **User**: User accounts with roles (customer, owner, admin)
- **Venue**: Sports venues with details and amenities
- **Court**: Individual courts within venues
- **Booking**: Court reservations with payment status
- **TimeSlot**: Available time slots for courts
- **Review**: User reviews and ratings
- **Notification**: System notifications

### Key Relationships
- Users can own multiple venues
- Venues contain multiple courts
- Courts have multiple time slots
- Users can make multiple bookings
- Bookings are linked to specific courts and time slots

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Password Hashing** using bcryptjs
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Input Validation** using express-validator
- **SQL Injection Protection** via Prisma ORM
- **XSS Protection** with helmet middleware
- **Secure File Uploads** to Cloudinary

## 📱 Responsive Design

QuickCourt is fully responsive and works seamlessly across:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## 📊 Performance Features

- **Code Splitting** for optimal bundle sizes
- **Lazy Loading** of components and images
- **API Caching** with TanStack Query
- **Image Optimization** via Cloudinary
- **Compression** middleware for API responses
- **Database Indexing** for fast queries

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Run database migrations: `npx prisma migrate deploy`
3. Build and start: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service

## 📝 Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:init` - Initialize database with sample data
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Run `npx prisma db push` to sync schema

2. **CORS Issues**
   - Verify FRONTEND_URL in backend .env
   - Check cors configuration in index.js

3. **Email Not Sending**
   - Verify email credentials in .env
   - Check spam folder
   - Ensure Gmail app passwords are used

4. **Stripe Payments Failing**
   - Verify Stripe keys in both environments
   - Check webhook endpoint configuration
   - Test with Stripe test cards

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 👥 Authors

- **Abhi Bhingradiya** - *Initial work* - [@Alecxender1402](https://github.com/Alecxender1402)

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Stripe** for seamless payment processing
- **Cloudinary** for image management
- **Prisma** for the excellent ORM
- **React Community** for the amazing ecosystem

## 📞 Support

For support, email abhib2706@gmail.com or join our Discord server.

## 🗺️ Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with calendar apps
- [ ] Loyalty points system
- [ ] Real-time chat support
- [ ] Advanced search with filters
- [ ] Membership management

---

**Built with ❤️ by the QuickCourt Team**