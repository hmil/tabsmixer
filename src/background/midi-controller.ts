import WebMidi, { InputEventControlchange } from 'webmidi';
import { AppStorage } from './state/app-storage';
import { StateController } from './state-controller';
import { ContentInterface } from 'content/content-interface';

export interface MidiDeviceConfig {
    inputName: string;
    /** List of faders. Each fader controls the corresponding mixer lane */
    inputs: number[];
}


const MIDI_PRESETS: { [key: string]: MidiDeviceConfig } = {
    'Teensy MIDI': {
        inputName: 'Teensy MIDI',
        inputs: [41]
    }
}

interface ActiveConfiguration {
    deactivate: () => void;
}

export class MidiController {

    private activeConfiguration: ActiveConfiguration | null = null;

    private get isConfigured() {
        return this.activeConfiguration != null;
    }

    constructor(private readonly storage: AppStorage,
            private readonly stateController: StateController,
            private readonly content: ContentInterface) { }

    init() {
        WebMidi.enable((err) => {
            if (err) {
                throw err;
            }
            this.refresh();

            WebMidi.addListener('connected', () => {
                this.refresh();
            });

            WebMidi.addListener('disconnected', () => {
                this.refresh();
            });
        });
    }

    useDevice(config: MidiDeviceConfig) {
        console.log(`Configuring ${config.inputName}`);

        if (this.isConfigured) {
            this.activeConfiguration?.deactivate();
            this.activeConfiguration = null;
        }

        if (config.inputName != 'null') {
            const input = WebMidi.getInputByName(config.inputName);
            if (input == false) {
                throw new Error(`Input ${config.inputName} is not available at the moment`);
            }

            const onInputChange = (evt: InputEventControlchange) => {
                const idx = config.inputs.findIndex(i => i === evt.controller.number);
                if (idx >= 0) {
                    const tab = this.storage.getTabByIndex(idx);
                    if (tab != null) {
                        const volume = evt.value / 127;
                        this.storage.setTabVolume(tab.tabId, volume);
                        this.content.setVolume(tab.tabId, volume);
                        this.stateController.refresh();
                    }
                }
            }

            input.addListener('controlchange', 1, onInputChange);

            this.activeConfiguration = {
                deactivate: () => {
                    input.removeListener('controlchange', 1, onInputChange);
                }
            };
        }

        this.storage.setCurrentMidiInput(config.inputName);
        this.stateController.refresh();
    }

    getConfigForDevice(device: string): MidiDeviceConfig {
        if (device in MIDI_PRESETS) {
            return MIDI_PRESETS[device];
        }

        // Default config. TODO: Offer a mapping configurator in the UI
        return {
            inputName: device,
            inputs: []
        };
    }

    private refresh() {
        if (WebMidi.enabled) {
            const inputs = WebMidi.inputs.map(input => input.name);
            this.tryAutoConfig(inputs);
            this.storage.setMidiInputs(inputs);
        }
        this.stateController.refresh();
    }

    private tryAutoConfig(inputs: string[]) {
        if (this.isConfigured) {
            return;
        }

        const found = inputs.find(i => i in MIDI_PRESETS);
        if (found != null) {
            const preset = MIDI_PRESETS[found];
            this.useDevice(preset);
        }
    }
}
