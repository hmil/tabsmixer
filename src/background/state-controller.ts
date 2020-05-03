import { AppStorage } from './state/app-storage';
import { BackgroundMessageOut } from './interface/background-transport';

export class StateController {

    constructor(private readonly storage: AppStorage) { }

    public refresh() {
        sendMessage({
            type: 'refresh',
            data: {
                tabs: this.storage.getAllTabs(),
                midiInputs: this.storage.getMidiInputs(),
                currentMidiInput: this.storage.getCurrentMidiInput()
            }
        });
    }
}

function sendMessage(m: BackgroundMessageOut) {
    chrome.runtime.sendMessage(m);
}
