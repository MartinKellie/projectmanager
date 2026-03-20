export const APP_TOAST_EVENT = 'app:toast'

export interface AppToastDetail {
  message: string
}

export function triggerAppToast({ message }: AppToastDetail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<AppToastDetail>(APP_TOAST_EVENT, { detail: { message } }))
}

