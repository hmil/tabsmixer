import { BackgroundInterface } from 'background/interface/background-interface';
import { AppState } from 'background/state/app-state';
import { ContentMessageOut } from 'content/content-transport';
import * as React from 'react';

import { Controls } from './Controls';
import { UITab } from './domain/UITab';
import { PopupContext } from './PopupContext';
import { Toolbar } from './Toolbar';


const background = new BackgroundInterface();
const POPUP_STYLE: React.CSSProperties = {
    minWidth: '300px'
};

interface SetBackgroundStateAction {
    type: 'setState';
    state: AppState;
}

interface SetTabLevelAction {
    type: 'setTabLevel';
    level: number;
    tabId: number;
}

type PopupAction = SetBackgroundStateAction | SetTabLevelAction;

interface PopupState {
    tabs: UITab[];
    midiInputs: string[];
    currentInput: string;
}

const INITIAL_STATE: PopupState = {
    tabs: [],
    midiInputs: [],
    currentInput: 'null'
}

export function Popup() {

    const [state, dispatch] = React.useReducer<React.Reducer<PopupState, PopupAction>>((state, action) => {
        switch (action.type) {
            case 'setTabLevel':
                return {
                        ...state,
                        tabs: state.tabs.map(t => {
                        if (t.tabId === action.tabId) {
                            return {
                                ...t,
                                level: action.level
                            };
                        }
                        return t;
                    })
                };
            case 'setState':
                return {
                    ...state,
                    midiInputs: action.state.midiInputs,
                    currentInput: action.state.currentMidiInput,
                    tabs: action.state.tabs.map(t => ({
                        ...t,
                        level: state.tabs.find(tab => tab.tabId === t.tabId)?.level ?? 0
                    }))
                };
        }
    }, INITIAL_STATE);
    const [currentTabId, setCurrentTabId] = React.useState<number | null>(null);

    function onContentMessage(message: ContentMessageOut, sender: chrome.runtime.MessageSender) {
        if (message.type === 'vuData') {
            if (sender.tab?.id != null) {
                console.log(message.data.value);
                dispatch({
                    type: 'setTabLevel',
                    level: message.data.value,
                    tabId: sender.tab.id 
                });
            }
        }
    }

    React.useEffect(() => {
        background.refresh();
        chrome.tabs.query({ active: true, currentWindow: true }, result => {
            if (result.length > 0 && result[0].id != null) {
                setCurrentTabId(result[0].id);
            }
        });
        chrome.runtime.onMessage.addListener(onContentMessage);
        const onStateChange = background.onStateChange(change => {
            dispatch({type: 'setState', state: change });
        });

        return () => {
            console.log('Unsubscribed');
            onStateChange.unsubscribe();
            chrome.runtime.onMessage.removeListener(onContentMessage);
        };
    }, []);

    const context = React.useMemo<PopupContext>(() => ({
        background,
        currentTabId
    }), [background, currentTabId])

    return <div style={POPUP_STYLE}>
            <PopupContext.Provider value={context}>
                <Toolbar midiInputs={state.midiInputs} currentInput={state.currentInput}/>
                <Controls tabs={state.tabs}/>
            </PopupContext.Provider>
        </div>
}
