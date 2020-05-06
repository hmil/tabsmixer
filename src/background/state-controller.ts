import { AppStorage } from './state/app-storage';
import { BackgroundMessageOut } from './interface/background-transport';

export class StateController {

    private internalListeners: Array<() => void> = [];

    constructor(private readonly storage: AppStorage) { }

    public refresh() {
        this.internalListeners.forEach(l => l());
        sendMessage({
            type: 'refresh',
            data: {
                tabs: this.storage.getAllTabs(),
                midiInputs: this.storage.getMidiInputs(),
                currentMidiInput: this.storage.getCurrentMidiInput()
            }
        });
    }

    public onRefresh(l: () => void) {
        this.internalListeners.push(l);
    }
}

function sendMessage(m: BackgroundMessageOut) {
    chrome.runtime.sendMessage(m);
}
