import { HostContext } from './types/host-context';

export type { HostContext };

export function mount(container: HTMLElement, context: HostContext): void {
  container.innerHTML = `<div id="wct-root">WCT Module loaded for user ${context.userId}</div>`;
}
