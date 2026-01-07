# mewmap

Interactive maps powered by SVG. For when WebGL/WebGPU is a bit too fancy.

```ts
import { mewmap } from 'mewmap';

const map = mewmap({
    svg: document.getElementById("mewmap"),
    longitude: 24.9384,
    latitude: 60.1699,
    zoom: 12,
});
```
