type ToastBridge = {
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
};

let bridge: ToastBridge | null = null;

export function registerToastHandlers(handlers: ToastBridge) {
  bridge = handlers;
}

export function showError(message: string, title = "Error") {
  bridge?.showError(message, title);
}

export function showSuccess(message: string, title = "Success") {
  bridge?.showSuccess(message, title);
}

export function showInfo(message: string, title = "Info") {
  bridge?.showInfo(message, title);
}
