import Octicon, { PrimitiveDot, PrimitiveDotStroke, Trashcan } from '@primer/octicons-react';
import * as React from 'react';

import { UITab } from './domain/UITab';
import { Fader } from './Fader';
import { PopupContext } from './PopupContext';

export interface TabControlProps {
    tab: UITab;
    onDragStart?: (tabId: number, offsetX: number, cursorX: number) => void;
}

export const TAB_CONTROL_WIDTH = 38;

export function TabControl({tab, onDragStart}: TabControlProps) {

    const ctx = React.useContext(PopupContext);
    const [ icon, setIcon ] = React.useState('tab.svg');

    const container = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        chrome.tabs.get(tab.tabId, result => {
            if (result.favIconUrl) {
                setIcon(result.favIconUrl);
            }
        })
    }, []);

    const isCurrentTab = tab.tabId === ctx.currentTabId;

    const removeTab = React.useCallback((evt: React.MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();
        // TODO: Restore tab defaults when removing
        ctx.background.removeTab(tab.tabId);
    }, [ctx.background]);

    function toggleMute(evt: React.MouseEvent) {
        evt.stopPropagation();
        evt.preventDefault();
        ctx.background.setMuted(tab.tabId, !tab.muted);
    }

    function onDown(evt: React.MouseEvent) {
        if (evt.button === 0) {
            evt.preventDefault();
            const offset = evt.clientX - (container.current?.getBoundingClientRect().left ?? 0);
            onDragStart && onDragStart(tab.tabId, offset, evt.clientX);
        }
    }

    function preventDrag(evt: React.MouseEvent) {
        evt.stopPropagation();
    }

    return <div ref={container} className={'slider-container ' + (isCurrentTab ? 'current' : '')} onMouseDown={onDown}>
        <div style={{height: '20px', width: '20px', margin: 'auto', marginBottom: '9px'}}>
            <img draggable="false" src={icon} style={{width: '100%', display: 'block', cursor: 'move'}}/>
        </div>
        <Fader tab={tab} />
        <button onMouseDown={preventDrag} onClick={removeTab} style={{
            backgroundColor: 'transparent'
        }}><Octicon icon={Trashcan}></Octicon></button>
        <button onMouseDown={preventDrag} onClick={toggleMute} title={tab.muted ? 'unmute' : 'mute'} style={{
            backgroundColor: tab.muted ? 'red' : 'transparent'
        }}>{ tab.muted ?
            <Octicon icon={PrimitiveDotStroke}/> :
            <Octicon icon={PrimitiveDot} />
        }</button>
    </div>;
}