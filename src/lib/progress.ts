const KEY = 'pea:progress';
export function getProgress(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
export function toggleProgress(id: string) {
  const p = new Set(getProgress());
  p.has(id) ? p.delete(id) : p.add(id);
  localStorage.setItem(KEY, JSON.stringify([...p]));
}
/** Marks every [data-lesson-id] element that is complete and fills [data-progress-for] counters. */
export function paintProgress() {
  const p = getProgress();
  document.querySelectorAll<HTMLElement>('[data-lesson-id]').forEach((el) => el.classList.toggle('is-complete', p.includes(el.dataset.lessonId!)));
  document.querySelectorAll<HTMLElement>('[data-progress-for]').forEach((el) => {
    const prefix = el.dataset.progressFor!;
    const total = Number(el.dataset.total ?? 0);
    const n = p.filter((x) => x.startsWith(prefix)).length;
    const bar = el.querySelector<HTMLElement>('[data-bar]'), txt = el.querySelector<HTMLElement>('[data-text]');
    if (bar) bar.style.width = `${total ? (n / total) * 100 : 0}%`;
    if (txt) txt.textContent = `${n} of ${total} complete`;
  });
}
