import { openDB, IDBPDatabase } from 'idb';
import { EpisodePlayback, Episode } from './Types';

console.log("loading the storage!");

const episodesStore = 'episodes';
const sourcesStore = 'sources';
const playbackStateStore = 'playbackState';

const db = getDB();

async function getDB(): Promise<IDBPDatabase> {
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

export async function putEpisode(episode: Episode) {
    db.then(function(db) {
        const tx = db.transaction(episodesStore, 'readwrite');
        const store = tx.objectStore(episodesStore);
        store.put(episode);
        return tx.done;
    }).then(function() {
        console.log('added episode to the store!', episode);
    });
}

export async function deleteEpisode(episodeGuid: string) {
    db.then(function(db) {
        const tx = db.transaction(episodesStore, 'readwrite');
        const store = tx.objectStore(episodesStore);
        store.delete(episodeGuid);
        return tx.done;
    });
}

export async function getAllEpisodes(): Promise<Array<Episode>> {
    return db.then(function (db) {
        var tx = db.transaction(episodesStore, 'readonly');
        var store = tx.objectStore(episodesStore);
        return store.getAll();
    }).then(function(episodes) {
        episodes.sort((a,b) => (a.indexInQueue || 0) > (b.indexInQueue || 0) ? -1 : (((b.indexInQueue || 0) > (a.indexInQueue || 0)) ? 1 : 0));
        return episodes;
    });
}

export async function putEpisodePlayback(playback: EpisodePlayback) {
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

export async function getEpisodePlayback(episodeGuid: string): Promise<EpisodePlayback> {
    return db.then(function (db) {
        var tx = db.transaction(playbackStateStore, 'readonly');
        var store = tx.objectStore(playbackStateStore);
        return store.get(episodeGuid);
    });
}
