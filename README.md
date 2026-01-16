# mewmap

![Bundle size badge](https://deno.bundlejs.com/badge?q=mewmap@latest)

Interactive vector maps in a tiny bundle size, powered by SVG.

```ts
import { mewmap } from 'mewmap';

const map = mewmap({
    svg: document.getElementById("mewmap"),
    longitude: 24.9384,
    latitude: 60.1699,
    zoom: 12,
});
```

```html
<svg id="mewmap" width="600" height="400"></svg>
```

Note that for complex maps some browsers may struggle to render at high frame rates, particularly on mobile devices.

## Why

Simplicity. More complex map rendering libraries are undoubtedly impressive and have their place, but many scenarios don't need their advanced features.

If you're looking to have a map on your website, with maybe a few markers and ability for visitors to interact with it, mewmap is a great choice.

## Roadmap

The aim is to cover most common use cases of a map on a website.

- [x] Functional rendering with reference map style (VersaTiles colorful; excluding symbols)
- [x] Raster sources/layers (satellite)
- [ ] Symbols rendering (text and icons)
- [ ] GeoJSON sources (markers, external data)
- [ ] More comprehensive Maplibe/Mapbox style spec support
- [ ] Server rendering
- [ ] Lightweight React wrapper

If there's something more you'd like to see, please open an issue or submit a pull request.
