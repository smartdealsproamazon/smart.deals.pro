import React, { useState } from 'react';
import Preloader from './Preloader';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  const handlePreloaderComplete = () => {
    setLoading(false);
  };

  return (
    <div className="App">
      {loading && (
        <Preloader 
          onComplete={handlePreloaderComplete} 
          duration={3000} // 3 seconds
        />
      )}
      
      <div className="main-content">
        <header className="App-header">
          <h1>Welcome to Your Website</h1>
          <p>
            This is your main content that appears after the preloader animation completes.
            The preloader works perfectly on both desktop and mobile devices.
          </p>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>Responsive Design</h3>
              <p>Works great on all screen sizes</p>
            </div>
            <div className="feature-card">
              <h3>Smooth Animation</h3>
              <p>Beautiful loading animations</p>
            </div>
            <div className="feature-card">
              <h3>Easy Integration</h3>
              <p>Simple to add to any React project</p>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}

export default App;