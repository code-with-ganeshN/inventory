import { pool } from '../config/db';

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
    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, action, entityType, entityId, JSON.stringify(oldValues), JSON.stringify(newValues), ipAddress, userAgent]
    );
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
    await pool.query(
      `INSERT INTO login_history (user_id, ip_address, user_agent) 
       VALUES ($1, $2, $3)`,
      [userId, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error logging login history:', error);
  }
}
