import { Router } from 'express';
import * as reports from '../controllers/report-controller';
import { requireAuth, requireRole } from '../middleware/auth';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

// Citizens and agents
reportsRouter.get('/map', reports.map); // before /:id so "map" isn't read as an id
reportsRouter.get('/:id', reports.details);
reportsRouter.post('/', reports.create);
reportsRouter.put('/:id/upvote', reports.upvote);
reportsRouter.delete('/:id/upvote', reports.removeUpvote);

// Agents only
reportsRouter.get('/', requireRole('agent'), reports.list);
reportsRouter.patch('/:id/status', requireRole('agent'), reports.updateStatus);
