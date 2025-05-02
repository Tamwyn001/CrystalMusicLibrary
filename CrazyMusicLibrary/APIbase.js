const getApiBase = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
      return 'http://localhost:4590';
    }
    return `http://${hostname}:4590`; // assume same host on local network
  };
const apiBase = getApiBase();
export default apiBase;
