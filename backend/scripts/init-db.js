import dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing QuickCourt database with sample data...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@quickcourt.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@quickcourt.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Admin user created:', admin.email);

    // Create sample venue owner
    const ownerPassword = await bcrypt.hash('owner123', 12);
    const owner = await prisma.user.upsert({
      where: { email: 'owner@quickcourt.com' },
      update: {},
      create: {
        name: 'Venue Owner',
        email: 'owner@quickcourt.com',
        password: ownerPassword,
        role: 'user', // Changed from 'owner' to 'user' for now
        isVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Venue owner created:', owner.email);

    // Create sample regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
      where: { email: 'user@quickcourt.com' },
      update: {},
      create: {
        name: 'Regular User',
        email: 'user@quickcourt.com',
        password: userPassword,
        role: 'user',
        isVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Regular user created:', user.email);

    // Create sample venue
    const venue = await prisma.venue.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Sports Central',
        description: 'Premium sports facility with multiple courts and amenities',
        address: '123 Sports Avenue, Downtown',
        location: 'Downtown',
        amenities: ['Parking', 'Changing Rooms', 'Cafeteria', 'WiFi', 'Air Conditioning'],
        photos: [
          'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3',
        ],
        rating: 4.5,
        totalReviews: 125,
        ownerId: owner.id,
        isApproved: true,
        contactEmail: 'info@sportscentral.com',
        contactPhone: '+1234567890',
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    });

    console.log('✅ Sample venue created:', venue.name);

    // Create sample courts
    const courts = [
      {
        id: 1,
        venueId: venue.id,
        name: 'Court 1 - Tennis',
        sportType: 'Tennis',
        pricePerHour: 50.0,
        description: 'Professional tennis court with high-quality surface',
        photos: ['https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3'],
        amenities: ['Net', 'Lighting', 'Seating'],
        isActive: true,
      },
      {
        id: 2,
        venueId: venue.id,
        name: 'Court 2 - Badminton',
        sportType: 'Badminton',
        pricePerHour: 30.0,
        description: 'Indoor badminton court with excellent ventilation',
        photos: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?ixlib=rb-4.0.3'],
        amenities: ['Shuttle cocks', 'Lighting', 'Air Conditioning'],
        isActive: true,
      },
      {
        id: 3,
        venueId: venue.id,
        name: 'Court 3 - Basketball',
        sportType: 'Basketball',
        pricePerHour: 40.0,
        description: 'Full-size basketball court with professional hoops',
        photos: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3'],
        amenities: ['Scoreboard', 'Lighting', 'Seating'],
        isActive: true,
      },
    ];

    for (const courtData of courts) {
      await prisma.court.upsert({
        where: { id: courtData.id },
        update: {},
        create: courtData,
      });
    }

    console.log('✅ Sample courts created');

    // Create sample time slots for each court
    const timeSlots = [];
    for (let courtId = 1; courtId <= 3; courtId++) {
      // Create time slots for each day of the week (0 = Sunday, 6 = Saturday)
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        // Create hourly slots from 6 AM to 10 PM
        for (let hour = 6; hour < 22; hour++) {
          const startTime = new Date();
          startTime.setHours(hour, 0, 0, 0);
          const endTime = new Date();
          endTime.setHours(hour + 1, 0, 0, 0);

          timeSlots.push({
            venueId: venue.id,
            courtId: courtId,
            dayOfWeek: dayOfWeek,
            startTime: startTime,
            endTime: endTime,
            isAvailable: true,
          });
        }
      }
    }

    // Insert time slots in batches
    for (const slot of timeSlots) {
      try {
        await prisma.timeSlot.create({
          data: slot,
        });
      } catch (error) {
        // Skip if already exists
        if (!error.message.includes('Unique constraint')) {
          console.error('Error creating time slot:', error.message);
        }
      }
    }

    console.log('✅ Sample time slots created');

    // Create sample booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startTime = new Date();
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(11, 0, 0, 0);

    const booking = await prisma.booking.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: user.id,
        courtId: 1,
        venueId: venue.id,
        bookingDate: tomorrow,
        startTime: startTime,
        endTime: endTime,
        totalAmount: 50.0,
        status: 'confirmed',
        paymentStatus: 'paid',
        confirmedAt: new Date(),
      },
    });

    console.log('✅ Sample booking created');

    // Create sample review
    const review = await prisma.review.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: user.id,
        venueId: venue.id,
        bookingId: booking.id,
        rating: 5,
        comment: 'Excellent facility! Clean courts and great amenities.',
        helpfulCount: 3,
      },
    });

    console.log('✅ Sample review created');

    // Create notification preferences for users
    for (const userData of [admin, owner, user]) {
      await prisma.notificationPreference.upsert({
        where: { userId: userData.id },
        update: {},
        create: {
          userId: userData.id,
          emailBookings: true,
          emailReminders: true,
          emailPromotions: false,
          pushBookings: true,
          pushReminders: true,
          pushPromotions: false,
          smsBookings: false,
          smsReminders: true,
        },
      });
    }

    console.log('✅ Notification preferences created');

    console.log('\n🎉 Database initialized successfully!');
    console.log('\n📋 Sample accounts created:');
    console.log('   Admin: admin@quickcourt.com / admin123');
    console.log('   Owner: owner@quickcourt.com / owner123');
    console.log('   User:  user@quickcourt.com / user123');
    console.log('\n🏟️  Sample venue and courts created');
    console.log('⏰ Time slots generated for 7 days a week');
    console.log('📅 Sample booking and review created');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
};

initializeDatabase();
