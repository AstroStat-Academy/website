import { useSyncExternalStore } from 'react';

// Hardware hints are coarse: unknown touch devices take the static path.
export function shouldFreezeMotion({ reduced = false, saveData = false, cores, memory, coarse = false }) {
  return reduced || saveData || (cores != null && cores <= 4) ||
    (memory != null && memory <= 4) || (coarse && (cores == null || memory == null));
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(any-pointer: coarse)');
const connection = navigator.connection;
const listeners = new Set();
let frozen;
function update() {
  frozen = document.hidden || shouldFreezeMotion({
    reduced: reduced.matches, coarse: coarse.matches,
    saveData: connection?.saveData, cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory,
  });
  document.documentElement.dataset.motion = frozen ? 'static' : 'animated';
  listeners.forEach(listener => listener());
}
reduced.addEventListener('change', update);
coarse.addEventListener('change', update);
connection?.addEventListener?.('change', update);
document.addEventListener('visibilitychange', update);
update();
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const useFrozenMotion = () => useSyncExternalStore(subscribe, () => frozen, () => true);
