import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Episode, EpisodePlayback } from './Types';

const ydoc = new Y.Doc();
const ymap = ydoc.getMap();
var queue: Y.Array<Episode>;
var playbackStore: Y.Map<EpisodePlayback>;

const provider = new IndexeddbPersistence('y-indexeddb', ydoc);
let initialSyncComplete = new Promise((resolve) => {
    provider.once('synced', resolve);
});

provider.on('synced', () => {
  console.log('Yjs indexeddb is loaded');

  queue = ymap.get('queue');
  if (!queue) {
    queue = new Y.Array();
    ymap.set('queue', queue);
  }
  playbackStore = ymap.get('playback');
  if (!playbackStore) {
    playbackStore = new Y.Map();
    ymap.set('playback', playbackStore);
  }
});

export async function putEpisodePlayback(playback: EpisodePlayback) {
    playbackStore.set(playback.episodeGuid, playback);
}

export async function getEpisodePlayback(episodeGuid: string): Promise<EpisodePlayback | undefined> {
    return playbackStore.get(episodeGuid);
}

export async function putEpisode(episode: Episode) {
    await initialSyncComplete;
    queue.unshift([episode]);
}

export async function getAllEpisodes(): Promise<Array<Episode>> {
    await initialSyncComplete;
    return queue.toArray();
}

export async function deleteEpisode(episodeGuid: string) {
    await initialSyncComplete;
    let index = queue.toArray().findIndex(e => episodeGuid === e.guid);
    if (index >= 0) {
        queue.delete(index);
    }
}