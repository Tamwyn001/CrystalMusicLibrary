const getApiBase = () => {
    const hostname = window.location.hostname;

    const isDev = import.meta.env.MODE === 'development';
    const PORT = isDev ? '4590' : window.location.port;
    if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
      return `http://localhost:${PORT}`;
    }
    return `http://${hostname}:${PORT}`; // assume same host on local network
  };
const apiBase = getApiBase();

export default apiBase;
