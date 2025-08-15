import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

class User {
  constructor(userData) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
    this.avatar = userData.avatar;
    this.phone = userData.phone;
    this.role = userData.role || 'user';
    this.isActive = userData.isActive !== undefined ? userData.isActive : true;
    this.isVerified = userData.isVerified !== undefined ? userData.isVerified : false;
    this.otpCode = userData.otpCode;
    this.otpExpiry = userData.otpExpiry;
    this.createdAt = userData.createdAt;
    this.updatedAt = userData.updatedAt;
    this.lastLogin = userData.lastLogin;
    this.suspendedAt = userData.suspendedAt;
    this.suspensionReason = userData.suspensionReason;
  }

  // Hash password before saving
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Create a new user
  static async create(userData) {
    const { name, email, password, avatar, role = 'user', isVerified = false } = userData;

    try {
      // Hash password
      const hashedPassword = await this.hashPassword(password);

      let userCreateData = {
        name,
        email,
        password: hashedPassword,
        avatar,
        role,
        isVerified,
      };

      if (!isVerified) {
        // Generate OTP for verification
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        userCreateData.otpCode = otpCode;
        userCreateData.otpExpiry = otpExpiry;
      }

      const user = await prisma.user.create({
        data: userCreateData,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const userInstance = new User(user);

      // Include OTP in response for email sending
      if (!isVerified && userCreateData.otpCode) {
        userInstance.otpCode = userCreateData.otpCode;
      }

      return userInstance;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('User already exists with this email');
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        avatar: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user ? new User(user) : null;
  }

  // Find user by ID
  static async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user ? new User(user) : null;
  }

  // Verify OTP
  static async verifyOTP(email, otpCode) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        otpCode: true,
        otpExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.otpCode !== otpCode) {
      throw new Error('Invalid OTP code');
    }

    if (new Date() > new Date(user.otpExpiry)) {
      throw new Error('OTP code has expired');
    }

    // Mark user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new User(updatedUser);
  }

  // Regenerate OTP
  async regenerateOTP() {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await prisma.user.update({
      where: { id: this.id },
      data: {
        otpCode,
        otpExpiry,
      },
    });

    return otpCode;
  }

  // Update last login
  async updateLastLogin() {
    const updatedUser = await prisma.user.update({
      where: { id: this.id },
      data: {
        lastLogin: new Date(),
      },
      select: {
        lastLogin: true,
      },
    });

    this.lastLogin = updatedUser.lastLogin;
    return this;
  }

  // Update user
  async update(updateData) {
    // Convert camelCase to snake_case for database fields
    const prismaUpdateData = {};

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        prismaUpdateData[key] = updateData[key];
      }
    });

    if (Object.keys(prismaUpdateData).length === 0) {
      throw new Error('No fields to update');
    }

    const updatedUser = await prisma.user.update({
      where: { id: this.id },
      data: prismaUpdateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new User(updatedUser);
  }

  // Delete user (soft delete)
  async delete() {
    const result = await prisma.user.update({
      where: { id: this.id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
      },
    });

    return !!result;
  }

  // Suspend user
  async suspend(reason) {
    const updatedUser = await prisma.user.update({
      where: { id: this.id },
      data: {
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new User(updatedUser);
  }

  // Unsuspend user
  async unsuspend() {
    const updatedUser = await prisma.user.update({
      where: { id: this.id },
      data: {
        suspendedAt: null,
        suspensionReason: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return new User(updatedUser);
  }

  // Get all users (admin only)
  static async findAll(filters = {}, limit = 10, offset = 0) {
    const where = {
      isActive: true,
      ...filters,
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        suspendedAt: true,
        suspensionReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return users.map((user) => new User(user));
  }

  // Get user count
  static async getCount(filters = {}) {
    const where = {
      isActive: true,
      ...filters,
    };

    return await prisma.user.count({ where });
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      avatar: this.avatar,
      phone: this.phone,
      role: this.role,
      isActive: this.isActive,
      isVerified: this.isVerified,
      lastLogin: this.lastLogin,
      suspendedAt: this.suspendedAt,
      suspensionReason: this.suspensionReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default User;
