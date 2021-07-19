import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

var audio: HTMLAudioElement | null;

interface Show {
  name?: string;
  url?: string;
}

function Player(props: {playing: boolean, setPlaying: (a: boolean) => void, show: Show}) {
  let playing = props.playing;
  let setPlaying = props.setPlaying;
  let show = props.show;

  useEffect(() => {
    console.log(`set show to ${show.name} at URL: ${show.url}`);
    if (show.url) {
      audio?.pause();  // Stop any previous player
      audio = new Audio(show.url);
      if (playing) {
        audio.play();
      }
    }
  }, [playing, show]);

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
      <button onClick={() => setPlaying(!playing)} disabled={show.url === undefined}>
        {buttonText}
      </button>
      <div>{show.name || ''}</div>
    </div>
  );
}

function ShowPicker(props: {setActiveShow: any}) {
  let setActiveShow = props.setActiveShow

  return (
    <div id="showpicker">
      <button onClick={() => {setActiveShow({name: 'Psytrance', url: 'https://stream.psychedelik.com:8000/listen.mp3'})}}>
        Psytrance
      </button>
      <button onClick={() => {setActiveShow({name: 'Drum N Bass', url: 'https://stream.psychedelik.com:8030/listen.mp3'})}}>
        Drum N Bass
      </button>
      <button onClick={() => {setActiveShow({name: 'Metamuse', url: 'https://media.museapp.com/podcast/34-bring-your-own-client.mp3'})}}>
        Metamuse
      </button>
    </div>
  );
}


function App() {
  const [playing, setPlaying] = useState(false);
  const [activeShow, setActiveShow] = useState({} as Show);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Player playing={playing} setPlaying={setPlaying} show={activeShow} />
        <ShowPicker setActiveShow={setActiveShow} />
      </header>
    </div>
  );
}

export default App;
