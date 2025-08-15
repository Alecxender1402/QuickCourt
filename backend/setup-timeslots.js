import prisma from './src/config/prisma.js';
import { TimeSlotService } from './src/services/timeSlotService.js';

async function setupTimeSlotDemo() {
  try {
    console.log('Setting up time slot management demo...');

    // Find the existing venue
    const venue = await prisma.venue.findFirst({
      where: { isApproved: true },
      include: { courts: true }
    });

    if (!venue) {
      console.log('No approved venue found');
      return;
    }

    console.log(`Found venue: ${venue.name} (ID: ${venue.id})`);
    console.log(`Courts: ${venue.courts.length}`);

    // Set working hours (9 AM to 9 PM, Monday to Sunday)
    const workingHours = [
      { dayOfWeek: 1, startTime: '09:00:00', endTime: '21:00:00', isActive: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00:00', endTime: '21:00:00', isActive: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00:00', endTime: '21:00:00', isActive: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00:00', endTime: '21:00:00', isActive: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00:00', endTime: '21:00:00', isActive: true }, // Friday
      { dayOfWeek: 6, startTime: '08:00:00', endTime: '22:00:00', isActive: true }, // Saturday
      { dayOfWeek: 0, startTime: '08:00:00', endTime: '22:00:00', isActive: true }, // Sunday
    ];

    console.log('Setting venue working hours...');
    await TimeSlotService.setVenueWorkingHours(venue.id, workingHours);
    console.log('Working hours set successfully');

    // Generate time slots for the next 30 days
    console.log('Generating time slots for the next 30 days...');
    const generatedCount = await TimeSlotService.generateTimeSlotsForVenue(venue.id, 30);
    console.log(`Generated ${generatedCount} time slots`);

    // Show some example available time slots for today
    const today = new Date().toISOString().split('T')[0];
    console.log(`\nAvailable time slots for ${today}:`);
    
    for (const court of venue.courts) {
      const availableSlots = await TimeSlotService.getAvailableTimeSlots(court.id, today);
      console.log(`\n${court.name} (${court.sportType}):`);
      availableSlots.slice(0, 5).forEach(slot => {
        console.log(`  ${slot.startTime} - ${slot.endTime} (₹${slot.pricePerSlot})`);
      });
      if (availableSlots.length > 5) {
        console.log(`  ... and ${availableSlots.length - 5} more slots`);
      }
    }

    console.log('\n✅ Time slot management demo setup complete!');
    console.log('\nYou can now:');
    console.log('1. View available time slots for courts');
    console.log('2. Book multiple consecutive time slots');
    console.log('3. Manage working hours for venues');
    console.log('4. Block/unblock specific time slots');

  } catch (error) {
    console.error('Error setting up demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTimeSlotDemo();
