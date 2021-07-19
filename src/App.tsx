import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function Player() {
  const [playing, setPlaying] = useState(false);

  const buttonText = playing ? 'Stop' : 'Play';

  return (
    <div id="player">
      <button onClick={() => setPlaying(!playing)}>
        {buttonText}
      </button>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Player />
      </header>
    </div>
  );
}

export default App;
