import { Request, Response } from 'express';
import { pool } from '../config/db';

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { user_id, action, entity_type, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, parseInt(limit as string) || 10);
    const offset = (pageNum - 1) * limitNum;
    
    const params: any[] = [];
    const conditions: string[] = [];

    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs';
    let dataQuery = 'SELECT * FROM audit_logs';

    if (user_id) {
      conditions.push(`user_id = $${params.length + 1}`);
      params.push(user_id);
    }

    if (action) {
      conditions.push(`action = $${params.length + 1}`);
      params.push(action);
    }

    if (entity_type) {
      conditions.push(`entity_type = $${params.length + 1}`);
      params.push(entity_type);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    dataQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const countResult = await pool.query(countQuery, params.slice(0, params.length - 2));
    const total = parseInt(countResult.rows[0].total);

    const result = await pool.query(dataQuery, params);
    res.json({
      data: {
        logs: result.rows,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAuditLogsByAction(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { action } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM audit_logs
       WHERE action = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [action, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get audit logs by action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAuditStatstics(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        action,
        COUNT(*) as count,
        entity_type,
        DATE(created_at) as date
      FROM audit_logs
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (start_date) {
      conditions.push(`created_at >= $${params.length + 1}::timestamp`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`created_at <= $${params.length + 1}::timestamp`);
      params.push(end_date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY action, entity_type, DATE(created_at) ORDER BY DATE(created_at) DESC, action';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get audit statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
