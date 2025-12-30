import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, Role } from '../entities/AllEntities';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export class AuthService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
  }) {
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await hashPassword(userData.password);
    const userRole = await this.roleRepository.findOne({ where: { name: 'USER' } });
    
    if (!userRole) {
      throw new Error('USER role not found');
    }

    const user = this.userRepository.create({
      ...userData,
      password_hash: passwordHash,
      role_id: userRole.id,
    });

    const savedUser = await this.userRepository.save(user);
    const token = generateToken({
      id: savedUser.id,
      email: savedUser.email,
      role: userRole.name,
    });

    return { user: savedUser, token, role: userRole.name };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    if (user.is_locked) {
      throw new Error('Account is locked');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Incorrect password. Please try again.');
    }

    await this.userRepository.update(user.id, { last_login: new Date() });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role.name,
      },
      token
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      role: user.role.name
    };
  }

  async updateProfile(userId: number, updateData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
  }) {
    const result = await this.userRepository.update(userId, {
      ...updateData,
      updated_at: new Date()
    });

    if (result.affected === 0) {
      throw new Error('User not found');
    }

    return await this.userRepository.findOne({ where: { id: userId } });
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid old password');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await this.userRepository.update(userId, { 
      password_hash: newPasswordHash,
      updated_at: new Date()
    });

    return { message: 'Password changed successfully' };
  }
}