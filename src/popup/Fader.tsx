import * as React from 'react';
import { TabEntry } from 'background/state/app-state';
import { PopupContext } from './PopupContext';

export interface FaderProps {
    tab: TabEntry;
}

export function Fader({tab}: FaderProps) {

    const container = React.useRef<HTMLDivElement>(null);
    const ctx = React.useContext(PopupContext);

    const [ icon, setIcon ] = React.useState('tab.svg');

    React.useEffect(() => {
        chrome.tabs.get(tab.tabId, result => {
            if (result.favIconUrl) {
                setIcon(result.favIconUrl);
            }
        })
    }, []);

    const isCurrentTab = tab.tabId === ctx.currentTabId;

    const removeTab = React.useCallback(() => {
        // TODO: Restore tab defaults when removing
        ctx.background.removeTab(tab.tabId);
    }, [ctx.background]);

    function mouseDown(evt: React.MouseEvent) {
        if (evt.button === 0) {
            evt.preventDefault();
            window.addEventListener('mouseup', onRelease);
            window.addEventListener('mousemove', onMove);
            updateSlide(evt.clientY);
        }
    }

    function onRelease() {
        window.removeEventListener('mouseup', onRelease);
        window.removeEventListener('mousemove', onMove);
    }

    function onMove(evt: MouseEvent) {
        
        updateSlide(evt.clientY);
    }

    function toggleMute() {
        ctx.background.setMuted(tab.tabId, !tab.muted);
    }

    function updateSlide(y: number) {
        const rect = container.current?.getBoundingClientRect();
        if (rect == null) {
            return;
        }
        const dy = y - rect.top;
        let percentage =  1 - (dy / (rect.bottom - rect.top));
        if (percentage < 0) {
            percentage = 0;
        } else if (percentage > 1) {
            percentage = 1;
        }
        ctx.background.setVolume(tab.tabId, percentage);
    }

    return <div className={'slider-container ' + (isCurrentTab ? 'current' : '')}>
        <img src={icon} style={{width: '20px', display: 'block', margin: 'auto', marginBottom: '9px'}} />
        <div className="fader" onMouseDown={mouseDown}>
            <div ref={container} className="fader-bar">
                <div className="fader-level" style={{
                    height: `${Math.round(tab.level * 100)}%`
                }}></div>
            </div>
            <div className="fader-handle" style={{
                top: `calc(${100 - Math.round(tab.volume * 100)}% - 2px)`
            }}></div>
        </div>
        <button onClick={removeTab}>x</button>
        <button onClick={toggleMute} style={{
            backgroundColor: tab.muted ? 'red' : 'transparent'
        }}>&bull;</button>
    </div>
}