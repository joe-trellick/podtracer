export interface Episode {
    guid: string;
    name?: string;
    url?: string;
    imageUrl?: string;
    durationString?: string;
    indexInSource: number;
}

export interface EpisodePlayback {
    episodeGuid: string;
    lastPlayed: Date;
    playbackSeconds?: number;  // Seconds into the episode last played; things like streams don't have this
}
  