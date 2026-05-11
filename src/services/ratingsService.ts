import api from './api';

export const getRatings = (projectId: string) =>
  api.get(`/api/projects/${projectId}/ratings`);

export const submitRating = (projectId: string, rating: number) =>
  api.post(`/api/projects/${projectId}/ratings`, { rating });

export const updateRating = (ratingId: string, rating: number) =>
  api.put(`/api/ratings/${ratingId}`, { rating });

export const deleteRating = (ratingId: string) =>
  api.delete(`/api/ratings/${ratingId}`);
