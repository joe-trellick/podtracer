# PodTracer

PodTracer is **a simple web-based podcast player** built as a learning project during
my time at the [Recurse Center](https://www.recurse.com/).

![](podtracer-screenshot.png)

Why another podcast player? Mostly I wanted a testbed for experimenting with **local-first user data** and decentralized sync technologies. A podcast player is something that (1) I can legitimately use while (2) not being too sad when I mess up and have to reset the data store.

It also gave me a way to get more familiar with React hooks and web media player APIs, and to generally see how far I could get without a server component.

## Limitations
You should consider this an unsupported toy project. The biggest limitation is that due to [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) restrictions, client javascript code can't request most podcast/RSS feeds from other servers, so PodTracer comes with some hardcoded feed content to test with.

## Running

As a fairly basic React app, PodTracer can be run locally via `yarn start` and built for production with `yarn build` as usual.

PodTracer uses IndexedDB to persist your list of shows and playback state in your browers. When you first run it on a particular device, the list will be empty. Click one of the `+ Add...` buttons to add some sample episodes, then click one of them to play. The play progress and speed setting for each episode should be preserved even after reloading the page.