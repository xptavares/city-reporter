import type { Request, RequestHandler } from 'express';
import { z } from 'zod';
import {
  createReportSchema,
  listReportsQuerySchema,
  mapQuerySchema,
  updateStatusSchema,
} from '@city-reporter/shared';
import * as reportService from '../services/report-service';
import { currentUser } from '../middleware/auth';

const idParamsSchema = z.object({ id: z.uuid() });
const reportId = (req: Request) => idParamsSchema.parse(req.params).id;

export const create: RequestHandler = async (req, res) => {
  const input = createReportSchema.parse(req.body);
  res.status(201).json(await reportService.createReport(input, currentUser(req).id));
};

export const map: RequestHandler = async (req, res) => {
  const query = mapQuerySchema.parse(req.query);
  res.json(await reportService.getMapPins(query));
};

export const details: RequestHandler = async (req, res) => {
  res.json(await reportService.getReportDetails(reportId(req), currentUser(req).id));
};

export const list: RequestHandler = async (req, res) => {
  const query = listReportsQuerySchema.parse(req.query);
  res.json(await reportService.listReports(query));
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { status } = updateStatusSchema.parse(req.body);
  res.json(await reportService.updateStatus(reportId(req), status, currentUser(req).id));
};

export const upvote: RequestHandler = async (req, res) => {
  const upvoteCount = await reportService.addUpvote(reportId(req), currentUser(req).id);
  res.json({ upvoteCount, upvotedByMe: true });
};

export const removeUpvote: RequestHandler = async (req, res) => {
  const upvoteCount = await reportService.removeUpvote(reportId(req), currentUser(req).id);
  res.json({ upvoteCount, upvotedByMe: false });
};
