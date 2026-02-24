import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Executive from './Executive.jsx';

// Routing: ?view=exec → Executive Dashboard, иначе → Manager App
const params = new URLSearchParams(window.location.search);
const view = params.get('view');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {view === 'exec' ? <Executive /> : <App />}
  </StrictMode>
);