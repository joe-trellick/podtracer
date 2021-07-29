import Parser from 'rss-parser';
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';

import './App.css';
import * as storage from './Storage';
import { WebnativeConnection } from './Fission';
import { EpisodePlayback, Episode } from './Types';
import playImage from './play.svg';
import pauseImage from './pause.svg';

var audio: HTMLAudioElement | null;
var fission = new WebnativeConnection();

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

// Test this on startup, mostly to remove extra Fission-related query params
// TODO: Also store whether we think we should be signed in in IndexedDB?
// TODO: Just always try to login on startup, to initialize?
function checkForLoginComplete() {
  const params = new URLSearchParams(window.location.search);
  if (!fission.isConnected() &&
    (params.get('newUrl') || params.get('username') || params.get('authorised'))) {
    tryLogin();
  }
}

function tryLogin() {
  if (!fission.isConnected()) {
    console.log("Trying login");
    const connect = async () => {
      await fission.connect();
      console.log("Done—needs auth?", fission.needsAuthentication());
      console.log("Done—is connected?", fission.isConnected());
      if (fission.needsAuthentication()) {
        fission.presentAuthenticationUI();
      } else {
        fission.testPrintFiles();
      }
    };
    connect();
  } else {
    fission.testPrintFiles();
  }
}

function tryLogout() {
  console.log("Trying logout");
  const logout = async () => {
    await fission.disconnect();
    console.log("Logged out");
  };
  logout();
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
  const episodeArt = useRef(null);
  const loadingSpinner = useRef(null);

  let hasDuration = duration && duration !== Infinity;

  useLayoutEffect(() => {
    const getStoredPlayback = async () => {
      let playback = await storage.getEpisodePlayback(db, show.guid);
      console.log('found previous awaited playback', playback);
      if (audio && playback?.playbackSeconds) {
        const timeSetterListener = () => {
          audio?.removeEventListener('durationchange', timeSetterListener);
          if (audio && playback.playbackSeconds && audio.duration && audio.duration !== Infinity) {
            audio.currentTime = playback.playbackSeconds;
          }
        };
        audio.addEventListener('durationchange', timeSetterListener);
      }
      if (audio && playback?.playbackSpeed) {
        audio.playbackRate = playback.playbackSpeed;
        setSpeed(playback.playbackSpeed);
      }
      audio?.play();
      setPlaying(true);
    };

    if (show.url && show.url !== previousShow?.url) {
      console.log(`set show to ${show.name} at URL: ${show.url}`);
      (episodeArt.current as unknown as HTMLDivElement).style.opacity = "0.5";
      (loadingSpinner.current as unknown as HTMLDivElement).style.visibility = "visible";
      audio?.pause();  // Stop any previous player
      audio = new Audio(show.url);
      if (show.name) {
        audio.title = show.name;
      }
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
      audio.addEventListener('canplay', () => {
        (episodeArt.current as unknown as HTMLDivElement).style.opacity = "1";
        (loadingSpinner.current as unknown as HTMLDivElement).style.visibility = "hidden";
      });
      getStoredPlayback();  // need to wait for this for mobile safari
    }
  }, [playing, show, previousShow, setPlaying]);

  useLayoutEffect(() => {
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
      const playback: EpisodePlayback = {
        episodeGuid: show.guid,
        lastPlayed: new Date(),
        playbackSeconds: hasDuration ? currentTime : undefined,
        playbackSpeed: speed};
      console.log("Attempting to store playback", playback);
      storage.putEpisodePlayback(db, playback);
    }
  }, [show, currentTime, speed, hasDuration]);

  let currentTimeString = '';
  if (currentTime) {
    currentTimeString = timeStringFromSeconds(currentTime);
  }
  let durationString = '';
  if (duration && hasDuration) {
    durationString = timeStringFromSeconds(duration);
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
      <div id="playerart" ref={episodeArt}>
        {show.imageUrl ? <img src={show.imageUrl} alt="Episode Art" /> : ''}
        <div id="spinner" ref={loadingSpinner} style={{visibility: 'hidden'}}><div></div><div></div></div>
      </div>
      <div id="playervstack">
        <div id="showname">{show.name || ''}</div>
        {/*  <div id="settings">
          <button onClick={tryLogin}>Login</button>
          <button onClick={tryLogout}>Logout</button>
        </div> */}
        <div id="playercontrols">
          <button onClick={() => setPlaying(!playing)} disabled={show.url === undefined}>
            <img src={playing ? pauseImage : playImage} alt={playing ? 'Pause' : 'Play'} />
          </button>
          <div id="playbackbox">
            <div id="sliderwithtimes">
              <input id="timeslider" type="range" value={hasDuration ? currentTime : 0}
                disabled={!hasDuration} min={0} max={duration}
                onChange={(event) => {setCurrentTime((event.target as HTMLInputElement).valueAsNumber)}}
                onMouseDown={interactionStart}
                onTouchStart={interactionStart}
                onMouseUp={interactionEnd}
                onTouchEnd={interactionEnd}
                ref={timeSlider}
              />
              <div id="playertimes">
                <div id="currenttime" style={hasDuration ? {visibility: "visible"} : {visibility: "hidden"}}>{currentTimeString}</div> 
                <div id="duration">{durationString}</div>
              </div>
            </div>
            <div id="speedcontrols">
              <input id="speed" type="range" value={speed} min="0.5" max="2" step="0.25" disabled={!hasDuration} onInput={(event) => {setSpeed((event.target as HTMLInputElement).valueAsNumber)}} />
              <span>{speed}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShowPicker(props: any) {
  const {setActiveShow, shows, addFeedContents, addEpisodes, removeEpisodeFromQueue} = props;

  const addSampleEpisodes = () => {
    var episodes = [] as Episode[];
    // A few test shows
    episodes.push({name: 'Toby Schachman: Cuttle, Apparatus, and Recursive Drawing', url: 'https://traffic.omny.fm/d/clips/c4157e60-c7f8-470d-b13f-a7b30040df73/564f493f-af32-4c48-862f-a7b300e4df49/27b6ee00-c968-4889-bb61-ad6c000a9322/audio.mp3?utm_source=Podcast&in_playlist=ac317852-8807-44b8-8eff-a7b300e4df52', imageUrl: 'https://www.omnycontent.com/d/playlist/c4157e60-c7f8-470d-b13f-a7b30040df73/564f493f-af32-4c48-862f-a7b300e4df49/ac317852-8807-44b8-8eff-a7b300e4df52/image.jpg?t=1501366431&size=Large', guid: '27b6ee00-c968-4889-bb61-ad6c000a9322', indexInSource: 4});
    episodes.push({name: '34 // Bring your own client with Geoffrey Litt', url: 'https://media.museapp.com/podcast/34-bring-your-own-client.mp3', imageUrl: 'https://media.museapp.com/podcast/metamuse-cover-2.png', guid: 'https://media.museapp.com/podcast/34-bring-your-own-client.mp3', indexInSource: 0});
    episodes.push({
      name: 'Drum & Bass On The Bike 4 - Brighton',
      url: 'https://trellick.work/files/dnb-bike-brighton.mp3',
      imageUrl: 'https://trellick.work/files/dnb-bike-brighton.png',
      guid: 'https://trellick.work/files/dnb-bike-brighton.mp3',
      indexInSource: 5});
      episodes.push({name: 'Psytrance', url: 'https://stream.psychedelik.com:8000/listen.mp3', imageUrl: 'https://www.psychedelik.com/img/psytrance.jpg', guid: 'https://stream.psychedelik.com:8000/listen.mp3', indexInSource: 1});
      episodes.push({name: 'Drum N Bass', url: 'https://stream.psychedelik.com:8030/listen.mp3', imageUrl: 'https://www.psychedelik.com/img/drumnbass.jpg', guid: 'https://stream.psychedelik.com:8030/listen.mp3', indexInSource: 2});
    addEpisodes(episodes);
  }

  // NOTE: Feeds urrently mocked up with local file to avoid CORS issues.
  //       Will need a proxy in real life.

  return (
    <div id="showpicker">
      <div id="addshows">
        <div onClick={() => addSampleEpisodes()}>+ Add Sample Episodes</div>
        <div onClick={() => addFeedContents('museapp.com/podcast.rss')}>+ Add Metamuse</div>
        <div onClick={() => addFeedContents('feeds.feedburner.com/headphonecommutepodcast.xml')}>+ Add Headphone Commute</div>
      </div>
      <ul>
      {shows.map((show: Episode, i: number) => {
        return (
          <li key={i} onClick={() => {setActiveShow(show)}}>
            <div>{show.name}</div>
            <div className="deletebutton" onClick={(event) => {event.stopPropagation(); removeEpisodeFromQueue(show);}}>delete</div>
          </li>
        );
      })}
      </ul>
    </div>
  );
}

type CustomItem = {itunesDuration: string, itunesImage: string};

const db = storage.getDB();

function App() {
  const [playing, setPlaying] = useState(false);
  const [activeShow, setActiveShow] = useState({} as Episode);
  const previousShow = usePrevious(activeShow) as unknown as Episode;
  const [episodes, setEpisodes] = useState([] as Episode[]);

  // Initial load
  useEffect(() => {
    checkForLoginComplete();
    loadEpisodes();
  }, []);

  const loadEpisodes = () => {
    const getAllEpisodes = async () => {
      let episodes = await storage.getAllEpisodes(db);

      console.log(`loaded ${episodes.length} episodes`);
      episodes.sort((a,b) => (a.indexInQueue || 0) > (b.indexInQueue || 0) ? -1 : (((b.indexInQueue || 0) > (a.indexInQueue || 0)) ? 1 : 0));
      setEpisodes(episodes);
    };
    getAllEpisodes();
  }

  const addFeedContents = (feed: string) => {
    console.log('add feed:', feed);
    const parser = new Parser<CustomItem>({
      customFields: {
        item: [
          ['itunes:duration', 'itunesDuration'],
          ['itunes:image', 'itunesImage']
        ]
      }
    });

    const fetchPosts = async (url: string) => {
      const feed = await parser.parseURL(url);
      console.log(`got feed with title ${feed.title}`);

      var shows = [] as Episode[];
      feed.items.forEach((item, i) => {
        let episode: Episode = {
          guid: item.guid || item.link || `${url}@${i}`,
          name: item.title,
          url: item.enclosure?.url,
          imageUrl: item.itunesImage?.href || feed.image?.url,
          durationString: item.itunesDuration,
          indexInSource: i}; 
        shows.push(episode);
      });
      addEpisodes(shows);
    }

    fetchPosts(feed);
  }

  const addEpisodes = (newEpisodes: Array<Episode>) => {
    console.log('add episodes:', newEpisodes);
    newEpisodes.reverse();
    let maxIndex = Math.max.apply(Math, episodes.map(episode => {return episode.indexInQueue || 0}));
    const putEpisodes = async (newEpisodes: Array<Episode>) => {
      newEpisodes.forEach(async episode => {
        episode.indexInQueue = maxIndex++;
        await storage.putEpisode(db, episode);
      });
      loadEpisodes();
    };
    putEpisodes(newEpisodes);
  }

  const removeEpisodeFromQueue = (episode: Episode) => {
    console.log('remove episode from queue:', episode);
    const removeEpisode = async (episode: Episode) => {
      await storage.deleteEpisode(db, episode.guid);
      loadEpisodes();
    };
    removeEpisode(episode);
  }

  return (
    <div className="App">
      <header className="App-header">
        <Player playing={playing} setPlaying={setPlaying} show={activeShow} previousShow={previousShow} />
        <ShowPicker
          setActiveShow={setActiveShow}
          shows={episodes}
          addFeedContents={addFeedContents}
          addEpisodes={addEpisodes}
          removeEpisodeFromQueue={removeEpisodeFromQueue} />
      </header>
    </div>
  );
}

export default App;
