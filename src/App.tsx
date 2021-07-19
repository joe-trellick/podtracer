import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

var audio: HTMLAudioElement | null;

interface Show {
  name?: string;
  url?: string;
}

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

function SourcePicker() {
  const [activeShow, setActiveShow] = useState({} as Show);

  useEffect(() => {
    console.log(`Set activeShow to ${activeShow.name}`);
  });

  return (
    <div id="sourcepicker">
      <button onClick={() => {setActiveShow({name: 'Psytrance', url: 'https://stream.psychedelik.com:8000/listen.mp3'})}}>
        Psytrance
      </button>
      <button onClick={() => {setActiveShow({name: 'Drum N Bass', url: 'https://stream.psychedelik.com:8030/listen.mp3'})}}>
        Drum N Bass
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
        <SourcePicker />
      </header>
    </div>
  );
}

export default App;
