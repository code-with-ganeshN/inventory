import { AppDataSource } from '../config/database';

export async function logAuditAction(
  userId: number | null,
  action: string,
  entityType: string | null,
  entityId: number | null,
  oldValues: any = null,
  newValues: any = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
): Promise<void> {
  try {
    // For now, just log to console since audit_logs table needs to be created as entity
    console.log('Audit Log:', {
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
}

export async function logLoginHistory(
  userId: number,
  ipAddress: string | null = null,
  userAgent: string | null = null
): Promise<void> {
  try {
    // For now, just log to console since login_history table needs to be created as entity
    console.log('Login History:', {
      userId,
      ipAddress,
      userAgent,
      loginTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging login history:', error);
  }
}
