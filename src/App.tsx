import React, { useEffect, useState, useRef } from 'react';
import logo from './logo.svg';
import './App.css';

var audio: HTMLAudioElement | null;

interface Show {
  name?: string;
  url?: string;
}

function usePrevious(value: any) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

interface PlayerProps {
  playing: boolean;
  setPlaying: (a: boolean) => void;
  show: Show;
  previousShow: Show;
}

function Player(props: PlayerProps) {
  const {playing, setPlaying, show, previousShow} = props;

  useEffect(() => {
    if (show.url && show.url !== previousShow?.url) {
      console.log(`set show to ${show.name} at URL: ${show.url}`);
      audio?.pause();  // Stop any previous player
      audio = new Audio(show.url);
      if (playing) {
        audio.play();
      }
    }
  }, [playing, show, previousShow]);

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
  const previousShow = usePrevious(activeShow) as unknown as Show;

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Player playing={playing} setPlaying={setPlaying} show={activeShow} previousShow={previousShow} />
        <ShowPicker setActiveShow={setActiveShow} />
      </header>
    </div>
  );
}

export default App;
