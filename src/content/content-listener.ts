import { ContentMessageIn, ContentMessageOut } from './content-transport';

export class ContentListener {

    constructor() {
    }

    init() {
        chrome.runtime.onMessage.addListener(message => this.handleMessage(message));
        window.addEventListener('message', message => {
            if (message.source != window) {
                return;
            }
            if (message.data.vuMeter != null && typeof message.data.vuMeter === 'number') {
                sendMessage({ type: 'vuData', data: { value: message.data.vuMeter }});
            }
        });
    }

    private handleMessage(message: ContentMessageIn) {
        switch (message.type) {
            case 'setVolume':
                window.postMessage({ changeVolume: message.data.volume }, window.location.toString());
                break;
            case 'setMuted':
                window.postMessage({ setMuted: message.data.muted }, window.location.toString());
                break;
        }
    }
}

function sendMessage(m: ContentMessageOut) {
    chrome.runtime.sendMessage(m);
}
