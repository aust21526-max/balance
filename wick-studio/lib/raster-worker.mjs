// Worker thread: SVG string in, RGBA pixels out.
import { parentPort } from 'node:worker_threads';
import { svgToRgba } from './raster.mjs';

parentPort.on('message', ({ id, svg }) => {
  const px = new Uint8Array(svgToRgba(svg)); // copy into a transferable buffer
  parentPort.postMessage({ id, px }, [px.buffer]);
});
