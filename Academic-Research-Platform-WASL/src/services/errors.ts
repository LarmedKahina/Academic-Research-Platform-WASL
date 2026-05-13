import axios from 'axios';

export const getErrorMessage = (error: unknown, conflictMessage = 'This action already exists') => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) return conflictMessage;
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
};
