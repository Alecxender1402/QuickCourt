import { query } from '../config/database.js';

// Create notifications table
export const createNotificationsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      related_id INTEGER,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`,
  ];

  try {
    await query(createTableQuery);

    // Create indexes separately
    for (const indexQuery of createIndexes) {
      await query(indexQuery);
    }

    console.log('✅ Notifications table ready');
  } catch (error) {
    console.error('❌ Error creating notifications table:', error.message);
    throw error;
  }
};

// Create notification preferences table
export const createNotificationPreferencesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      email_bookings BOOLEAN DEFAULT TRUE,
      email_reminders BOOLEAN DEFAULT TRUE,
      email_promotions BOOLEAN DEFAULT FALSE,
      push_bookings BOOLEAN DEFAULT TRUE,
      push_reminders BOOLEAN DEFAULT TRUE,
      push_promotions BOOLEAN DEFAULT FALSE,
      sms_bookings BOOLEAN DEFAULT FALSE,
      sms_reminders BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);`,
  ];

  try {
    await query(createTableQuery);

    // Create indexes separately
    for (const indexQuery of createIndexes) {
      await query(indexQuery);
    }

    console.log('✅ Notification preferences table ready');
  } catch (error) {
    console.error('❌ Error creating notification preferences table:', error.message);
    throw error;
  }
};

// Create payment intents table
export const createPaymentIntentsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS payment_intents (
      id VARCHAR(255) PRIMARY KEY,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      currency VARCHAR(10) DEFAULT 'usd',
      status VARCHAR(50) NOT NULL,
      client_secret VARCHAR(255),
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_payment_intents_booking_id ON payment_intents(booking_id);`,
    `CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);`,
  ];

  try {
    await query(createTableQuery);

    // Create indexes separately
    for (const indexQuery of createIndexes) {
      await query(indexQuery);
    }

    console.log('✅ Payment intents table ready');
  } catch (error) {
    console.error('❌ Error creating payment intents table:', error.message);
    throw error;
  }
};

// Create refunds table
export const createRefundsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS refunds (
      id VARCHAR(255) PRIMARY KEY,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
      payment_intent_id VARCHAR(255) REFERENCES payment_intents(id),
      amount DECIMAL(10,2) NOT NULL,
      reason TEXT,
      status VARCHAR(50) NOT NULL,
      processed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);`,
    `CREATE INDEX IF NOT EXISTS idx_refunds_payment_intent_id ON refunds(payment_intent_id);`,
  ];

  try {
    await query(createTableQuery);

    // Create indexes separately
    for (const indexQuery of createIndexes) {
      await query(indexQuery);
    }

    console.log('✅ Refunds table ready');
  } catch (error) {
    console.error('❌ Error creating refunds table:', error.message);
    throw error;
  }
};
// Create review helpful table
export const createReviewHelpfulTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS review_helpful (
      id SERIAL PRIMARY KEY,
      review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(review_id, user_id)
    );
  `;

  const createIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);`,
    `CREATE INDEX IF NOT EXISTS idx_review_helpful_user_id ON review_helpful(user_id);`,
  ];

  try {
    await query(createTableQuery);

    // Create indexes separately
    for (const indexQuery of createIndexes) {
      await query(indexQuery);
    }

    console.log('✅ Review helpful table ready');
  } catch (error) {
    console.error('❌ Error creating review helpful table:', error.message);
    throw error;
  }
};

// Add missing columns to existing tables
export const addMissingColumns = async () => {
  try {
    // Add helpful_count to reviews table
    await query(`
      ALTER TABLE reviews
      ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0
    `);

    // Add reviewed column to bookings table
    await query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE
    `);

    // Add confirmed_at to bookings table
    await query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP
    `);
    await query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP
    `);

    // Add cancellation fields to bookings table
    await query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
      ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP
    `);

    // Add venue approval fields
    await query(`
      ALTER TABLE venues
      ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);

    // Add user suspension fields
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS suspension_reason TEXT
    `);

    // Add venue statistics columns
    await query(`
      ALTER TABLE venues
      ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0
    `);

    console.log('✅ Missing columns added successfully');
  } catch (error) {
    console.error('❌ Error adding missing columns:', error.message);
    throw error;
  }
};

// Initialize all new tables
export const initializeNewTables = async () => {
  try {
    await createNotificationsTable();
    await createNotificationPreferencesTable();
    await createReviewHelpfulTable();
    await createPaymentIntentsTable();
    await createRefundsTable();
    await addMissingColumns();
    console.log('✅ All new database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing new tables:', error.message);
    throw error;
  }
};
