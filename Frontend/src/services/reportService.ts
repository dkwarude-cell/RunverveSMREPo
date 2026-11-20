/**
 * reportService.ts - saved AI Scan reports (Backend: /api/reports, stored in Firestore users/{uid}/reports).
 */
import { getAuth } from '@react-native-firebase/auth';
import { NativeModules, Platform } from 'react-native';
import apiClient, { apiErrorMessage } from './apiClient';
import type { AnalyzeResponse } from './agentService';

export type ReportSummary = { bodyPart: string; wound: string; severity: 'mild' | 'moderate' | 'severe' | null };

export type ReportListItem = { id: string; createdAt: string | null; summary: ReportSummary; thumb: string | null };

export type SavedReport = { id: string; createdAt: string | null; summary: ReportSummary; result: AnalyzeResponse; photo: string | null };

async function auth() {
  const current = getAuth().currentUser;
  if (!current) throw new Error('You are not logged in.');
  return { headers: { Authorization: `Bearer ${await current.getIdToken()}` } };
}

export const ReportService = {
  /** saves a finished scan, returns the new report id */
  async save(result: AnalyzeResponse, summary: ReportSummary, photoBase64?: string): Promise<string> {
    try {
      const res = await apiClient.post('/reports', { result, summary, photoBase64 }, { ...(await auth()), timeout: 30000 });
      return res.data.id;
    } catch (e) {
      throw new Error(apiErrorMessage(e, 'Could not save the report'));
    }
  },

  async list(): Promise<ReportListItem[]> {
    try {
      const res = await apiClient.get('/reports', await auth());
      return res.data.reports ?? [];
    } catch (e) {
      throw new Error(apiErrorMessage(e, 'Could not load your reports'));
    }
  },

  async get(id: string): Promise<SavedReport> {
    try {
      const res = await apiClient.get(`/reports/${id}`, await auth());
      return res.data.report;
    } catch (e) {
      throw new Error(apiErrorMessage(e, 'Could not open the report'));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/reports/${id}`, await auth());
    } catch (e) {
      throw new Error(apiErrorMessage(e, 'Could not delete the report'));
    }
  },

  /** builds the PDF on the backend and opens the share sheet (WhatsApp, email, Drive...) */
  async exportPdf(id: string): Promise<void> {
    if (Platform.OS !== 'android' || !NativeModules.ReportShare) throw new Error('PDF export is only available on Android for now.');
    let pdf: { fileName: string; base64: string };
    try {
      const res = await apiClient.get(`/reports/${id}/pdf`, { ...(await auth()), timeout: 30000 });
      pdf = res.data;
    } catch (e) {
      throw new Error(apiErrorMessage(e, 'Could not create the PDF'));
    }
    await NativeModules.ReportShare.sharePdf(pdf.base64, pdf.fileName);
  },
};
