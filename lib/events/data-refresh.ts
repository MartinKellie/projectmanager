export const APP_DATA_REFRESH_EVENT = 'app:data-refresh'

export function triggerAppDataRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(APP_DATA_REFRESH_EVENT))
}

