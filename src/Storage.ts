import { openDB, IDBPDatabase } from 'idb';
import { EpisodePlayback, Show } from './Types';

console.log("loading the storage!");

const episodesStore = 'episodes';
const sourcesStore = 'sources';
const playbackStateStore = 'playbackState';

export async function getDB(): Promise<IDBPDatabase> {
    const db = await openDB('podtracer', 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log('making a new object store');
            if (!db.objectStoreNames.contains(episodesStore)) {
                db.createObjectStore(episodesStore, {keyPath: 'guid'});
            }
            if (!db.objectStoreNames.contains(sourcesStore)) {
                db.createObjectStore(sourcesStore, {keyPath: 'guid'});
            }
            if (!db.objectStoreNames.contains(playbackStateStore)) {
                db.createObjectStore(playbackStateStore, {keyPath: 'episodeGuid'});
            }
        },
        blocked() {
          // There's an older version of this DB open somewhere
        },
        blocking() {
          // This connection is blocking a DB version upgrade
        },
        terminated() {
          // Unhappy termination case
        },
      });
    return db;
}

export async function putEpisode(db: Promise<IDBPDatabase>, episode: Show) {
    db.then(function(db) {
        const tx = db.transaction(episodesStore, 'readwrite');
        const store = tx.objectStore(episodesStore);
        store.put(episode);
        return tx.done;
    }).then(function() {
        console.log('added episode to the store!');
    });
}

export async function putEpisodePlayback(db: Promise<IDBPDatabase>, playback: EpisodePlayback) {
    db.then(function(db) {
        const tx = db.transaction(playbackStateStore, 'readwrite');
        const store = tx.objectStore(playbackStateStore);
        console.log('trying to store playback', playback);
        store.put(playback);
        return tx.done;
    }).then(function() {
        console.log('added playback to the store!');
    });
}

export async function getEpisodePlayback(db: Promise<IDBPDatabase>, episodeGuid: string): Promise<EpisodePlayback> {
    return db.then(function (db) {
        var tx = db.transaction(playbackStateStore, 'readonly');
        var store = tx.objectStore(playbackStateStore);
        return store.get(episodeGuid);
    }).then(function (playback) {
        console.log('found the playback', playback);
        return playback;
    });
}
