import * as agent from "content/agent";
import { ContentListener } from 'content/content-listener';

console.log('Hello content');

const observer = new MutationObserver(() => {
    console.log('Injecting agent into page');
    const script = document.createElement('script');
    script.innerHTML = `(function() {${agent}})();`; // Wrap agent in iife
    script.id = 'hmil-tabsmixer-agent';
    document.head.append(script);
    observer.disconnect();
});
observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
});

const listener = new ContentListener();
listener.init();
