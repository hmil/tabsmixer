import { BackgroundMessageIn } from './interface/background-transport';
import { AppStorage } from './state/app-storage';
import { ContentInterface } from 'content/content-interface';
import { StateController } from './state-controller';
import { MidiController } from './midi-controller';

export class BackgroundListener {

    constructor(
            private readonly storage: AppStorage, 
            private readonly stateController: StateController,
            private readonly midiController: MidiController,
            private readonly content: ContentInterface) {
    }

    init() {
        chrome.runtime.onMessage.addListener(message => this.handleMessage(message));
        chrome.tabs.onRemoved.addListener(tabId => {
            this.storage.removeTab(tabId);
            this.stateController.refresh();
        });
    }

    private handleMessage(message: BackgroundMessageIn) {
        switch (message.type) {
            case 'addTab':
                this.storage.addTab(message.data);
                this.stateController.refresh();
                break;
            case 'removeTab':
                this.storage.removeTab(message.data);
                this.stateController.refresh();
                break;
            case 'moveTab':
                this.storage.moveTab(message.data.tabId, message.data.newIndex);
                this.stateController.refresh();
                break;
            case 'refresh':
                this.stateController.refresh();
                break;
            case 'setVolume':
                this.storage.setTabVolume(message.data.tabId, message.data.volume);
                this.content.setVolume(message.data.tabId, message.data.volume);
                this.stateController.refresh();
                break;
            case 'setMuted':
                this.storage.setTabMuted(message.data.tabId, message.data.muted);
                this.content.setMuted(message.data.tabId, message.data.muted);
                this.stateController.refresh();
                break;
            case 'setMidiDevice':
                this.midiController.useDevice(this.midiController.getConfigForDevice(message.data.device));
                break;
        }
    }
}

