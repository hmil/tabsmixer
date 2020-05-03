import { AppState, TabEntry } from '../state/app-state';
import { BackgroundMessageIn, BackgroundMessageOut } from './background-transport';

export interface ChangeListener {
    unsubscribe(): void;
}

export class BackgroundInterface {

    private _initialized: boolean = false;

    private listeners: Set<(s: AppState) => void> = new Set();

    addTab(t: TabEntry): void {
        sendMessage({
            type: 'addTab',
            data: t
        });
    }

    moveTab(tabId: number, newIndex: number): void {
        sendMessage({
            type: 'moveTab',
            data: {
                tabId, newIndex
            }
        });
    }

    removeTab(tabId: number): void {
        sendMessage({
            type: 'removeTab',
            data: tabId
        });
    }

    onStateChange(l: (state: AppState) => void): ChangeListener {
        this.init();
        this.listeners.add(l);
        return {
            unsubscribe: () => {
                this.listeners.delete(l)
            }
        };
    }

    refresh() {
        sendMessage({type: 'refresh', data: undefined });
    }

    setVolume(tabId: number, volume: number) {
        sendMessage({
            type: 'setVolume',
            data: { tabId, volume }
        });
    }

    setMuted(tabId: number, muted: boolean) {
        sendMessage({
            type: 'setMuted',
            data: { tabId, muted }
        });
    }

    setMidiDevice(device: string) {
        sendMessage({
            type: 'setMidiDevice',
            data: { device }
        });
    }

    private init() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;

        chrome.runtime.onMessage.addListener((message: BackgroundMessageOut) => {
            if (message.type === 'refresh') {
                this.listeners.forEach(l => {
                    l(message.data);
                });
            }
        });
    }
}

function sendMessage(m: BackgroundMessageIn) {
    chrome.runtime.sendMessage(m);
}
