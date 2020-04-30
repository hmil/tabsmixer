import { ContentMessageIn } from './content-transport';

export class ContentInterface {
    setVolume(tabId: number, volume: number) {
        sendMessage(tabId, { type: 'setVolume', data: { volume } });
    }
    setMuted(tabId: number, muted: boolean) {
        sendMessage(tabId, { type: 'setMuted', data: { muted } });
    }
}

function sendMessage(tabId: number, m: ContentMessageIn) {
    chrome.tabs.sendMessage(tabId, m);
}