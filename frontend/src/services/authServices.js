import API from './api';

export const loginUser = (email, password) => {
  return API.post('/auth/login', { email, password });
};

export const logoutUser = () => {
  delete window.authToken;
};

export const getProfile = () => {
  return API.get('/auth/profile');
};