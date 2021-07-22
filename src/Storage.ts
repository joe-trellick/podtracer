import { openDB, IDBPDatabase } from 'idb';

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
                db.createObjectStore(playbackStateStore, {keyPath: 'guid'});
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

export async function putEpisode(db: Promise<IDBPDatabase>, episode: any) {
    db.then(function(db) {
        const tx = db.transaction(episodesStore, 'readwrite');
        const store = tx.objectStore(episodesStore);
        store.put(episode);
        return tx.done;
    }).then(function() {
        console.log('added item to the store os!');
    });
}
