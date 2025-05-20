
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add console log to verify app is loading
console.log('App initializing...');
console.log('Smart features enabled');

createRoot(document.getElementById("root")!).render(<App />);
