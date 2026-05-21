import { create } from 'axios';

import { API_BASE_URL } from '@/constants/config';

const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
