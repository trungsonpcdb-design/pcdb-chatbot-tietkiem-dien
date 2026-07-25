export function attachSessionEndListeners(cb: () => void): () => void {
  const IDLE_MS = 5 * 60 * 1000;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(cb, IDLE_MS);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") cb();
  };

  const onBeforeUnload = () => cb();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("mousemove", resetIdle, { passive: true });
  window.addEventListener("keydown", resetIdle, { passive: true });
  resetIdle();

  return () => {
    if (idleTimer) clearTimeout(idleTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("beforeunload", onBeforeUnload);
    window.removeEventListener("mousemove", resetIdle);
    window.removeEventListener("keydown", resetIdle);
  };
}
