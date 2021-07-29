export interface Episode {
    guid: string;
    name?: string;
    url?: string;
    imageUrl?: string;
    durationString?: string;
    indexInSource: number;

    // TODO: Put this somewhere external to the episode (belongs to queue concept instead)?
    indexInQueue?: number;
}

export interface EpisodePlayback {
    episodeGuid: string;
    lastPlayed: Date;
    playbackSeconds?: number;  // Seconds into the episode last played; things like streams don't have this
    playbackSpeed?: number;
}
  