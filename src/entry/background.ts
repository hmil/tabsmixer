import { BackgroundListener } from 'background/background-listener';
import { AppStorage } from 'background/state/app-storage';
import { ContentInterface } from 'content/content-interface';
import { StateController } from 'background/state-controller';
import { MidiController } from 'background/midi-controller';

const storage = new AppStorage(localStorage);
const content = new ContentInterface();
const stateController = new StateController(storage);
const midiController = new MidiController(storage, stateController, content);
const listener = new BackgroundListener(storage, stateController, midiController, content);

listener.init();
midiController.init();
