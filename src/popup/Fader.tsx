import * as React from 'react';
import { PopupContext } from './PopupContext';
import { UITab } from './domain/UITab';

export interface FaderProps {
    tab: UITab;
}

export function Fader({tab}: FaderProps) {

    const container = React.useRef<HTMLDivElement>(null);
    const ctx = React.useContext(PopupContext);

    function mouseDown(evt: React.MouseEvent) {
        if (evt.button === 0) {
            evt.preventDefault();
            evt.stopPropagation();
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

    return <div className="fader">
        <div style={{ position: 'relative' }} onMouseDown={mouseDown}>
            <div ref={container} className="fader-bar">
                <div className="fader-level" style={{
                    height: `${Math.round(tab.level * 100)}%`
                }}></div>
            </div>
            <div className="fader-handle" style={{
                top: `calc(${100 - Math.round(tab.volume * 100)}% - 2px)`
            }}></div>
        </div>
    </div>;
}