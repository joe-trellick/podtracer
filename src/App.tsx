import Parser from 'rss-parser';
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

function ShowPicker(props: any) {
  const {setActiveShow, shows} = props;

  return (
    <div id="showpicker">
      <ul>
      {shows.map((show: Show, i: number) => {
        return (
          <li key={i} onClick={() => {setActiveShow(show)}}>
            {show.name}
          </li>
        );
      })}
      </ul>
    </div>
  );
}


function App() {
  const [playing, setPlaying] = useState(false);
  const [activeShow, setActiveShow] = useState({} as Show);
  const previousShow = usePrevious(activeShow) as unknown as Show;

  const [posts, setPosts] = useState([] as Show[]);

  useEffect(() => {
    const parser = new Parser();

    const fetchPosts = async () => {
      // NOTE: Currently mocked up with local file to avoid CORS issues.
      //       Will need a proxy in real life.
      const url = 'feeds.feedburner.com/headphonecommutepodcast.xml';
      const feed = await parser.parseURL(url);
      console.log(`got feed with title ${feed.title}`);

      var shows = [] as Show[];
      // A few test shows
      shows.push({name: 'Metamuse', url: 'https://media.museapp.com/podcast/34-bring-your-own-client.mp3'});
      shows.push({name: 'Psytrance', url: 'https://stream.psychedelik.com:8000/listen.mp3'});
      shows.push({name: 'Drum N Bass', url: 'https://stream.psychedelik.com:8030/listen.mp3'});

      feed.items.forEach(item => {
        console.log(`* ${item.title} at ${item.link} with ${item.enclosure?.url}`);
        shows.push({name: item.title, url: item.enclosure?.url})
      });
      setPosts(shows);
      // setPosts(feed.items);
    }

    fetchPosts();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Player playing={playing} setPlaying={setPlaying} show={activeShow} previousShow={previousShow} />
        <ShowPicker setActiveShow={setActiveShow} shows={posts}/>
      </header>
    </div>
  );
}

export default App;
