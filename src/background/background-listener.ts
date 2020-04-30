import { BackgroundMessageIn, BackgroundMessageOut } from './background-transport';
import { AppStorage } from './state/app-storage';
import { ContentInterface } from 'content/content-interface';

export class BackgroundListener {

    constructor(
            private readonly storage: AppStorage, 
            private readonly content: ContentInterface) {
    }

    init() {
        chrome.runtime.onMessage.addListener(message => this.handleMessage(message));
        chrome.tabs.onRemoved.addListener(tabId => {
            this.storage.removeTab(tabId);
            this.refresh();
        });
    }

    private handleMessage(message: BackgroundMessageIn) {
        switch (message.type) {
            case 'addTab':
                this.storage.addTab(message.data);
                this.refresh();
                break;
            case 'removeTab':
                this.storage.removeTab(message.data);
                this.refresh();
                break;
            case 'refresh':
                this.refresh();
                break;
            case 'setVolume':
                this.storage.setTabVolume(message.data.tabId, message.data.volume);
                this.content.setVolume(message.data.tabId, message.data.volume);
                this.refresh();
                break;
            case 'setMuted':
                this.storage.setTabMuted(message.data.tabId, message.data.muted);
                this.content.setMuted(message.data.tabId, message.data.muted);
                this.refresh();
        }
    }

    private refresh() {
        sendMessage({
            type: 'refresh',
            data: {
                tabs: this.storage.getAllTabs()
            }
        });
    }
}

function sendMessage(m: BackgroundMessageOut) {
    chrome.runtime.sendMessage(m);
}
