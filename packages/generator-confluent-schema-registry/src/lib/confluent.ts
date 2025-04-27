import axios from 'axios';

export const getSchemasFromRegistry = async (url: string, auth?: { username: string; password: string }) => {
  const response = await axios.get(`${url}/schemas`, {
    auth,
  });
  return response.data;
};

export const getLatestVersionFromSubject = async (url: string, subject: string) => {
  const response = await axios.get(`${url}/subjects/${subject}/versions/latest`);
  return response.data;
};
