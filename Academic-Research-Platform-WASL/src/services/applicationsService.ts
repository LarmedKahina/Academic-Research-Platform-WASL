import api from './api';

export const applyToOpportunity = (opportunityId: string, message?: string) =>
  api.post(`/api/opportunities/${opportunityId}/apply`, { message });

export const getApplicationsForOpportunity = (opportunityId: string) =>
  api.get(`/api/opportunities/${opportunityId}/applications`);

export const getMyApplications = () =>
  api.get('/api/applications/mine');

export const updateApplicationStatus = (applicationId: string, status: string) =>
  api.put(`/api/applications/${applicationId}/status`, { status });
