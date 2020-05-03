import * as React from 'react';
import { PopupContext } from './PopupContext';

const TOOLBAR_STYLE: React.CSSProperties = {
    height: '24px',
    backgroundColor: '#737982',
}

interface ToolbarProps {
    midiInputs: string[];
    currentInput: string;
}

export function Toolbar({midiInputs, currentInput}: ToolbarProps) {

    const { background } = React.useContext(PopupContext);

    const onMidiChange = React.useCallback((evt: React.ChangeEvent<HTMLSelectElement>) => {
        const device = evt.target.value;
        background.setMidiDevice(device);
    }, [background]);

    return <div style={TOOLBAR_STYLE}>
        <div style={{ float: 'right'}}>
            <label>midi device&nbsp;</label>
            <select value={currentInput} onChange={onMidiChange}>
                <option value="null">-</option>
                { midiInputs.map(input => <option value={input}>{input}</option>) }
            </select>
        </div>
    </div>;
}
