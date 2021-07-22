export interface Show {
    guid: string;
    name?: string;
    url?: string;
    durationString?: string;
}

export interface EpisodePlayback {
    episodeGuid: string;
    lastPlayed: Date;
    playbackSeconds?: number;  // Seconds into the episode last played; things like streams don't have this
}
  