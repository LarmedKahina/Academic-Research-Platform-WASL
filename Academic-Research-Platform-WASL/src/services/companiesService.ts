import api from './api';

export const getCompanies = (params?: object) =>
  api.get('/api/companies', { params });

export const getCompany = (id: string) =>
  api.get(`/api/companies/${id}`);

export const updateCompany = (id: string, data: object) =>
  api.put(`/api/companies/${id}`, data);

export const getOpportunities = (params?: object) =>
  api.get('/api/opportunities', { params });

export const getOpportunity = (id: string) =>
  api.get(`/api/opportunities/${id}`);

export const getCompanyOpportunities = (companyId: string) =>
  api.get(`/api/companies/${companyId}/opportunities`);

export const createOpportunity = (companyId: string, data: object) =>
  api.post(`/api/companies/${companyId}/opportunities`, data);

export const updateOpportunity = (opportunityId: string, data: object) =>
  api.put(`/api/opportunities/${opportunityId}`, data);

export const deleteOpportunity = (opportunityId: string) =>
  api.delete(`/api/opportunities/${opportunityId}`);
