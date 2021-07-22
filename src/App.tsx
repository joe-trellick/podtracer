import Parser from 'rss-parser';
import React, { useEffect, useState, useRef } from 'react';

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

function timeStringFromSeconds(seconds: number): string {
  const roundedSeconds = Math.round(seconds);
  const hourInSeconds = 60 * 60;
  const secondsString = `${roundedSeconds % 60}`.padStart(2, '0');
  const minutesString = (Math.trunc(roundedSeconds / 60) % 60).toString();
  if (seconds > hourInSeconds) {
    const hours = Math.trunc(roundedSeconds / hourInSeconds);
    return `${hours}:${minutesString.padStart(2, '0')}:${secondsString}`;
  } else {
    return `${minutesString}:${secondsString}`;
  }
}

function Player(props: PlayerProps) {
  const {playing, setPlaying, show, previousShow} = props;
  const [currentTime, setCurrentTime] = useState(0 as number | undefined);
  const [duration, setDuration] = useState(undefined as number | undefined);
  const [speed, setSpeed] = useState(1);
  const timeSlider = useRef(null);

  let hasDuration = duration && duration !== Infinity;

  useEffect(() => {
    if (show.url && show.url !== previousShow?.url) {
      console.log(`set show to ${show.name} at URL: ${show.url}`);
      audio?.pause();  // Stop any previous player
      audio = new Audio(show.url);
      setSpeed(audio.playbackRate);
      audio.addEventListener('timeupdate', (event) => {
        let source = event.target as HTMLAudioElement;
        if ((timeSlider.current as unknown as HTMLInputElement).dataset.interacting !== "true") {
          setCurrentTime(source.currentTime);
        }
      });
      audio.addEventListener('durationchange', (event) => {
        let source = event.target as HTMLAudioElement;
        console.log(`duration changed to ${source.duration}`);
        setDuration(source.duration);
      });
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

  useEffect(() => {
    console.log(`speed set to ${speed}`);
    if (audio) {
       audio.playbackRate = speed;
    }
  }, [speed]);

  const buttonText = playing ? 'Stop' : 'Play';
  let currentTimeString = '';
  if (currentTime) {
    currentTimeString = timeStringFromSeconds(currentTime);
  }
  if (duration && hasDuration) {
    currentTimeString += ` of ${timeStringFromSeconds(duration)}`;
  }

  const interactionStart = (event: any) => {
    if (audio) {
      (timeSlider.current as unknown as HTMLInputElement).dataset.interacting = "true";
    }
  };

  const interactionEnd = (event: any) => {
    if (audio) {
      (timeSlider.current as unknown as HTMLInputElement).dataset.interacting = "false";
      audio.currentTime = (event.target as HTMLInputElement).valueAsNumber;
    }
  };

  return (
    <div id="player">
      <button onClick={() => setPlaying(!playing)} disabled={show.url === undefined}>
        {buttonText}
      </button>
      <div id="showname">{show.name || ''}</div>
      <div id="playbackbox">
        <input id="timeslider" type="range" value={hasDuration ? currentTime : 0}
          disabled={!hasDuration} min={0} max={duration}
          onChange={(event) => {setCurrentTime((event.target as HTMLInputElement).valueAsNumber)}}
          onMouseDown={interactionStart}
          onTouchStart={interactionStart}
          onMouseUp={interactionEnd}
          onTouchEnd={interactionEnd}
          ref={timeSlider}
        />
        <div id="currenttime">{currentTimeString}</div> 
      </div>
      <input id="speed" type="range" value={speed} min="0.5" max="2" step="0.25" onInput={(event) => {setSpeed((event.target as HTMLInputElement).valueAsNumber)}} />
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
