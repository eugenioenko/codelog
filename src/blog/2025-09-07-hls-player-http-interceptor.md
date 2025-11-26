---
author: Eugene Yakhnenko
pubDatetime: 2025-09-07
title: "Custom HTTP Interceptors in HLS.js for Video Streaming"
slug: hls-http-interceptor
featured: false
tags:
  - video
  - streaming
  - hls
  - http 
  - interceptor
  - javascript
  - react
description: "Learn how to use HLS.js for adaptive video streaming and implement custom HTTP interceptors to handle video fragment loading in React applications."
---

# Custom HTTP Interceptors in HLS.js for Video Streaming

When building video streaming applications, you might need to intercept HTTP requests for authentication, custom decryption, or analytics during video playback. HLS.js makes this surprisingly straightforward with custom loaders. Let's explore what HLS.js is and how to implement HTTP interceptors for video fragment loading.

## What is HLS.js?

HLS.js is a JavaScript library that enables HTTP Live Streaming (HLS) playback in browsers that don't natively support it. While Safari handles HLS natively, browsers like Chrome, Firefox, and Edge need HLS.js to parse `.m3u8` playlists and stream video fragments seamlessly.

The library handles:
- Parsing HLS manifests (`.m3u8` files)
- Downloading and buffering video segments
- Adaptive bitrate switching based on network conditions
- Video playback coordination

## Installation

Install HLS.js via npm or pnpm:

```bash
npm install hls.js
# or
pnpm add hls.js
```

## Basic Usage

Here's a minimal React implementation:

```tsx
import { useEffect, useRef } from "react";
import Hls from "hls.js";

export function HlsPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playlistUrl = "https://example.com/video.m3u8";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(playlistUrl);
      hls.attachMedia(video);
    }
  }, []);

  return <video ref={videoRef} controls />;
}
```

## Implementing a Custom HTTP Interceptor

The real power comes when you need to intercept fragment requests. 
Create a custom loader by extending `Hls.DefaultConfig.loader`:

```tsx
class CustomLoader extends Hls.DefaultConfig.loader {
  load(context: any, config: any, callbacks: any) {
    if (context.frag) {
      // Handle video fragments with custom logic
      fetchVideoFragment(callbacks, context);
    } else {
      // Use default loader for playlists
      super.load(context, config, callbacks);
    }
  }
};

```

The `context.frag` check distinguishes between playlist requests (handled by the default loader) and video fragment requests (where we apply custom logic).

## Custom Fragment Fetcher

Here's how to fetch fragments with custom handling:

```tsx
async function fetchVideoFragment(callbacks: any, context: any) {
  const start = performance.now();
  
  try {
    const response = await fetch(context.url, {
      // Add custom headers here if needed
      headers: {
        'Authorization': '{{ Bearer token }}',
        'X-Custom-Header': '{{Custom value}}'
      }
    });
    
    const buffer = await response.arrayBuffer();
    const end = performance.now();

    callbacks.onSuccess(
      { data: buffer, url: context.url },
      {
        loading: { start, end },
        loaded: buffer.byteLength,
        retry: 0,
      },
      context
    );
  } catch (error) {
    callbacks.onError(
      {
        code: 0,
        text: (error as Error).message,
        type: "networkError",
      },
      { loading: { start, end: performance.now() }, retry: 0 },
      context
    );
  }
}
```

This approach lets you:
- Add authentication tokens to fragment requests
- Decrypt encrypted video segments
- Track loading performance metrics
- Implement custom error handling
- Apply transformations to video data before playback

## Putting It Together

Wire up the custom loader when initializing HLS:

```tsx
export function HlsPlayerHttpInterceptor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playlistUrl = "https://example.com/video.m3u8";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        // uses the custom loader
        loader: CustomLoader,
      });

      hls.loadSource(playlistUrl);
      hls.attachMedia(video);
    }
  }, []);

  return <video ref={videoRef} controls />;
}
```

## Use Cases

Custom HTTP interceptors are particularly useful for:

- **Protected content**: Adding authentication headers to video fragment requests
- **DRM workflows**: Decrypting video segments before playback
- **Analytics**: Tracking fragment load times and network performance
- **Caching strategies**: Implementing custom caching logic
- **A/B testing**: Routing requests to different CDN endpoints
