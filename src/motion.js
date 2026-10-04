import { useSyncExternalStore } from 'react';

// Four CPU threads or 4 GB of RAM are common on usable desktops.
export function shouldFreezeMotion({ reduced = false, saveData = false, cores, memory, mobile = false }) {
  return reduced || saveData || mobile ||
    (cores != null && cores <= 2) || (memory != null && memory <= 2);
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width: 768px), (max-width: 1024px) and (pointer: coarse)');
const connection = navigator.connection;
const listeners = new Set();
let frozen;
function update() {
  frozen = document.hidden || shouldFreezeMotion({
    reduced: reduced.matches, mobile: mobile.matches,
    saveData: connection?.saveData, cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory,
  });
  document.documentElement.dataset.motion = frozen ? 'static' : 'animated';
  listeners.forEach(listener => listener());
}
reduced.addEventListener('change', update);
mobile.addEventListener('change', update);
connection?.addEventListener?.('change', update);
document.addEventListener('visibilitychange', update);
update();
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const useFrozenMotion = () => useSyncExternalStore(subscribe, () => frozen, () => true);
