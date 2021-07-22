import Parser from 'rss-parser';
import React, { useEffect, useState, useRef } from 'react';

import './App.css';
import * as storage from './Storage';
import { EpisodePlayback, Episode } from './Types';

var audio: HTMLAudioElement | null;

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
  show: Episode;
  previousShow: Episode;
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

function durationStringToSeconds(durationString: string | undefined): number | undefined {
  if (!durationString) {
    return undefined;
  }

  let seconds = 0;
  const parts = durationString.split(':').reverse();
  if (parts.length === 0) {
    return undefined;
  }

  let multiplier = 1;
  parts.forEach(partString => {
    const partNumber = Number.parseInt(partString);
    if (isNaN(partNumber)) {
      return undefined;
    }
    seconds += partNumber * multiplier;
    multiplier *= 60;  // fails if you get into days or something
  });

  return seconds;
}

function Player(props: PlayerProps) {
  const {playing, setPlaying, show, previousShow} = props;
  const [currentTime, setCurrentTime] = useState(0 as number | undefined);
  const [duration, setDuration] = useState(undefined as number | undefined);
  const [speed, setSpeed] = useState(1);
  const timeSlider = useRef(null);

  let hasDuration = duration && duration !== Infinity;

  useEffect(() => {
    const getStoredPlayback = async () => {
      let playback = await storage.getEpisodePlayback(db, show.guid);
      console.log('found previous awaited playback', playback);
      if (audio && playback?.playbackSeconds) {
        audio.currentTime = playback.playbackSeconds;
      }
      if (playing) {
        audio?.play();
      }
    };

    if (show.url && show.url !== previousShow?.url) {
      console.log(`set show to ${show.name} at URL: ${show.url}`);
      audio?.pause();  // Stop any previous player
      audio = new Audio(show.url);
      setSpeed(audio.playbackRate);
      setDuration(durationStringToSeconds(show.durationString));
      setCurrentTime(0);
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
      getStoredPlayback();
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

  useEffect(() => {
    if (show.guid) {
      const playback: EpisodePlayback = {episodeGuid: show.guid, lastPlayed: new Date(), playbackSeconds: currentTime};
      console.log("Attempting to store playback", playback);
      storage.putEpisodePlayback(db, playback);
    }
  }, [show, currentTime]);

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
      {shows.map((show: Episode, i: number) => {
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

type CustomItem = {itunesDuration: string};

const db = storage.getDB();

function App() {
  const [playing, setPlaying] = useState(false);
  const [activeShow, setActiveShow] = useState({} as Episode);
  const previousShow = usePrevious(activeShow) as unknown as Episode;

  const [posts, setPosts] = useState([] as Episode[]);

  useEffect(() => {
    const parser = new Parser<CustomItem>({
      customFields: {
        item: [['itunes:duration', 'itunesDuration']]
      }
    });

    const fetchPosts = async () => {
      // NOTE: Currently mocked up with local file to avoid CORS issues.
      //       Will need a proxy in real life.
      const url = 'feeds.feedburner.com/headphonecommutepodcast.xml';
      const feed = await parser.parseURL(url);
      console.log(`got feed with title ${feed.title}`);

      var shows = [] as Episode[];
      // A few test shows
      shows.push({name: 'Metamuse', url: 'https://media.museapp.com/podcast/34-bring-your-own-client.mp3', guid: 'https://media.museapp.com/podcast/34-bring-your-own-client.mp3', indexInSource: 0});
      shows.push({name: 'Psytrance', url: 'https://stream.psychedelik.com:8000/listen.mp3', guid: 'https://stream.psychedelik.com:8000/listen.mp3', indexInSource: 1});
      shows.push({name: 'Drum N Bass', url: 'https://stream.psychedelik.com:8030/listen.mp3', guid: 'https://stream.psychedelik.com:8030/listen.mp3', indexInSource: 2});

      feed.items.forEach((item, i) => {
        console.log(`* ${item.title} at ${item.link} with ${item.enclosure?.url}`);
        let episode: Episode = {
          guid: item.guid || item.link || `${url}@${i}`,
          name: item.title, url: item.enclosure?.url,
          durationString: item.itunesDuration,
          indexInSource: i}; 
        shows.push(episode);
        storage.putEpisode(db, episode);
      });
      setPosts(shows);
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
