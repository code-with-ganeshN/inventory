import { AppDataSource } from '../config/database';
import { Role, User } from '../entities/AllEntities';
import { hashPassword } from '../utils/password';

export async function seedRoles() {
  try {
    const roleRepository = AppDataSource.getRepository(Role);
    const roles = [
      { name: 'SUPER_ADMIN', description: 'Super Administrator with full system access' },
      { name: 'ADMIN', description: 'Administrator with access to products, inventory, and orders' },
      { name: 'USER', description: 'Regular user with access to browsing and ordering' },
    ];

    for (const roleData of roles) {
      const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!existingRole) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`✓ Created role: ${roleData.name}`);
      }
    }

    console.log('✓ Roles seeded successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
}

export async function seedDefaultUsers() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    // Create Super Admin
    const existingSuperAdmin = await userRepository.findOne({ where: { email: 'admin@inventory.local' } });
    if (!existingSuperAdmin) {
      const superAdminRole = await roleRepository.findOne({ where: { name: 'SUPER_ADMIN' } });
      if (superAdminRole) {
        const password = await hashPassword('admin@123456');
        const superAdmin = userRepository.create({
          email: 'admin@inventory.local',
          password_hash: password,
          first_name: 'System',
          last_name: 'Administrator',
          role_id: superAdminRole.id,
          is_active: true
        });
        await userRepository.save(superAdmin);
        console.log('✓ Super Admin created (Email: admin@inventory.local, Password: admin@123456)');
      }
    }

    // Create Admin User
    const existingAdmin = await userRepository.findOne({ where: { email: 'admin@test.com' } });
    if (!existingAdmin) {
      const adminRole = await roleRepository.findOne({ where: { name: 'ADMIN' } });
      if (adminRole) {
        const password = await hashPassword('admin123');
        const admin = userRepository.create({
          email: 'admin@test.com',
          password_hash: password,
          first_name: 'Admin',
          last_name: 'User',
          role_id: adminRole.id,
          is_active: true
        });
        await userRepository.save(admin);
        console.log('✓ Admin user created (Email: admin@test.com, Password: admin123)');
      }
    }
  } catch (error) {
    console.error('Error seeding default users:', error);
  }
}

export async function initializeDatabase() {
  try {
    console.log('Initializing database seeds...');
    await seedRoles();
    await seedDefaultUsers();
    console.log('✓ Database initialization complete');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}
