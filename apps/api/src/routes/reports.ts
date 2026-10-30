import { Router } from 'express';
import * as reports from '../controllers/report-controller';
import { requireAuth, requireRole } from '../middleware/auth';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

// Citizens and agents
reportsRouter.get('/map', reports.map); // before /:id so "map" isn't read as an id
reportsRouter.get('/:id', reports.details);
reportsRouter.post('/', reports.create);

// Citizens only: upvotes are the citizens' priority signal (decision 014)
reportsRouter.put('/:id/upvote', requireRole('citizen'), reports.upvote);
reportsRouter.delete('/:id/upvote', requireRole('citizen'), reports.removeUpvote);

// Agents only
reportsRouter.get('/', requireRole('agent'), reports.list);
reportsRouter.patch('/:id/status', requireRole('agent'), reports.updateStatus);
