import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Popup } from "popup/Popup";

console.log('popup');

ReactDOM.render(
    React.createElement(Popup, null),
    document.getElementById('app')
);