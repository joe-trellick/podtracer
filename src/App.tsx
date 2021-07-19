import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

var audio: HTMLAudioElement | null;

function Player() {
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('https://stream.psychedelik.com:8000/listen.mp3');

  useEffect(() => {
    console.log(`set audioUrl to ${audioUrl}`);
    audio = new Audio(audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    console.log(`playing is now ${playing}`);
    if (playing) {
      audio?.play();
    } else {
      audio?.pause();
    }
  }, [playing]);

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
