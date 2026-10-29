// Rasterises frames on all CPU cores while keeping output order.
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';

export async function* rasterInOrder(svgs, threads = Math.max(1, availableParallelism())) {
  const workers = Array.from({ length: threads }, () => new Worker(new URL('./raster-worker.mjs', import.meta.url)));
  const pending = new Map(); // id -> Promise<pixels>
  const waiters = new Map();
  workers.forEach((w) => w.on('message', ({ id, px }) => { waiters.get(id)(Buffer.from(px.buffer)); waiters.delete(id); }));
  const iter = svgs[Symbol.iterator]();
  let next = 0, sent = 0, done = false;
  const send = () => {
    const r = iter.next();
    if (r.done) { done = true; return; }
    const id = sent++;
    pending.set(id, new Promise((res) => waiters.set(id, res)));
    workers[id % threads].postMessage({ id, svg: r.value });
  };
  try {
    for (let i = 0; i < threads * 3 && !done; i++) send();
    while (pending.has(next)) {
      const px = await pending.get(next);
      pending.delete(next++);
      if (!done) send();
      yield px;
    }
  } finally {
    await Promise.all(workers.map((w) => w.terminate()));
  }
}
