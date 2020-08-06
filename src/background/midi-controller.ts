import WebMidi, { InputEventControlchange, Output, InputEventNoteon } from 'webmidi';
import { AppStorage } from './state/app-storage';
import { StateController } from './state-controller';
import { ContentInterface } from 'content/content-interface';
import { ContentMessageOut } from 'content/content-transport';

export interface MidiDeviceConfig {
    inputName: string;
    /** List of faders. Each fader controls the corresponding mixer lane */
    inputs: number[];
    
    outputConfig?: MidiDeviceOutputConfig;
}

interface MidiDeviceOutputConfig {
    outputName: string;
    outputs: Array<{
        leds: Array<MidiDeviceOutputLedsConfig>;
    }>;
}

interface MidiDeviceOutputLedsConfig {
    note: number;
    channel: number;
    mapping?: (value: number) => number;
}

function values(start: number, end: number, values: number[]) {
    const range = end - start;
    return (n: number) => {
        if (start >= n) {
            return 0;
        } else if (end < n) {
            return values[values.length - 1];
        }
        const idx = Math.floor((n - start - 1) / range * values.length);
        return values[idx];
    }
}

function launchkeyLedOutputPreset() {
    return [[36, 40], [37, 41], [38, 42], [39, 43], [44, 48], [45, 49], [46, 50], [47, 51]]
        .map(([lo, hi]) => ({
            leds: [{
                note: lo,
                channel: 16,
                mapping: values(1, 64, [19, 18, 17, 16])
            }, {
                note: hi,
                channel: 16,
                mapping: values(64, 128, [19, 18, 17, 16, 12, 9])
            }]
        }));
}

const MIDI_PRESETS: { [key: string]: MidiDeviceConfig } = {
    'Teensy MIDI': {
        inputName: 'Teensy MIDI',
        inputs: [41, 42, 43],
        outputConfig: {
            outputName: 'Teensy MIDI',
            outputs: [{
                leds: [{
                    note: 36,
                    channel: 16,
                    mapping: values(1, 128, [0, 31, 63, 95, 127])
                }]
            }, {
                leds: [{
                    note: 37,
                    channel: 16,
                    mapping: values(1, 128, [0, 31, 63, 95, 127])
                }]
            }, {
                leds: [{
                    note: 38,
                    channel: 16,
                    mapping: values(1, 128, [0, 31, 63, 95, 127])
                }]
            }],
        }
    },
    'Launchkey MK2 49 Launchkey MIDI': {
        inputName: 'Launchkey MK2 49 Launchkey MIDI',
        inputs: [21, 22, 23, 24, 25, 26, 27, 28],
        outputConfig: {
            outputName: 'Launchkey MK2 49 Launchkey InControl',
            outputs: launchkeyLedOutputPreset()
        }
    }
}

interface ActiveConfiguration {
    deactivate: () => void;
    outputs: Array<{
        output: Output;
        leds: MidiDeviceOutputLedsConfig[];
    }>;
}

export class MidiController {

    private activeConfiguration: ActiveConfiguration | null = null;

    private screenState: Array<{
        tabId: number;
        hasZero: boolean;
        value: number;
    }> = [];

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

            this.stateController.onRefresh(() => {
                this.refreshLEDs();
            });
            chrome.runtime.onMessage.addListener((m, sender) => this.handleContentMessage(m, sender));
        });
    }

    useDevice(config: MidiDeviceConfig) {
        console.log(`Configuring ${config.inputName}`);

        if (this.isConfigured) {
            this.activeConfiguration?.deactivate();
            this.activeConfiguration = null;
        }

        let deactivate = () => {};
        let outputs: ActiveConfiguration['outputs'] = [];

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
            };

            const onNoteOn = (evt: InputEventNoteon) => {
                console.log(evt.note);
            };

            input.addListener('controlchange', 1, onInputChange);
            input.addListener('noteon', 16, onNoteOn);
            deactivate = () => {
                input.removeListener('controlchange', 1, onInputChange);
                input.removeListener('noteon', 16, onNoteOn);
            };
        }

        if (config.outputConfig != null) {
            const output = WebMidi.getOutputByName(config.outputConfig.outputName);
            if (output == false) {
                throw new Error(`Output ${config.outputConfig.outputName} is not available at the moment`);
            }

            outputs = config.outputConfig.outputs.map(o => ({
                output,
                leds: o.leds
            }));
        }

        this.activeConfiguration = { deactivate, outputs };

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
            inputs: [],
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

    private refreshLEDs() {
        const tabs = this.storage.getAllTabs();
        this.screenState = this.screenState.map((ss, i) => {
            if (i >= tabs.length) {
                return {
                    ...ss,
                    value: 0
                };
            } else {
                return {
                    hasZero: ss.hasZero,
                    tabId: tabs[i].tabId,
                    value: this.screenState.find(tab => tab.tabId === tabs[i].tabId)?.value ?? 0
                }
            }
        });
        this.activeConfiguration?.outputs.map((o, i) => {
            let ss = this.screenState[i];
            if (ss == null) {
                ss = {
                    hasZero: false,
                    tabId: -1,
                    value: 0
                };
                this.screenState[i] = ss;
            }
            const value = ss.value;
            if (value === 0) {
                if (ss.hasZero) {
                    return; // Shortcut to avoid sending a ton of zeros
                } else {
                    ss.hasZero = true;
                }
            } else {
                ss.hasZero = false;
            }
            o.leds.forEach(l => {
                const velocity = l.mapping ? l.mapping(value) : value;
                if (velocity > 0) {
                    o.output.playNote(l.note, l.channel, {
                        velocity, rawVelocity: true
                    });
                } else {
                    o.output.stopNote(l.note, l.channel);
                }
            });
        });
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

    private handleContentMessage(m: ContentMessageOut, sender: chrome.runtime.MessageSender) {
        switch (m.type) {
            case 'vuData':
                this.screenState = this.screenState.map(s => {
                    if (s.tabId === sender.tab?.id) {
                        return { ...s, value: Math.floor(m.data.value * 128) };
                    } else {
                        return s;
                    }
                });
                this.refreshLEDs();
                break;
        }
    }
}
