// Считает картинку вне основного потока, чтобы ползунки не подвисали
import { render } from './core.js';

self.onmessage = event => {
  const { id, params, width, height, progress } = event.data;
  const started = performance.now();
  const data = render(params, width, height, {
    channels: 4,
    onRow: progress ? share => self.postMessage({ id, progress: share }) : undefined,
  });
  self.postMessage({ id, width, height, data, ms: Math.round(performance.now() - started) }, [data.buffer]);
};
