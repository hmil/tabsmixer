
export type agent = () => void;
/**
 * Warning! This function is inlined. It cannot use anything from the outside context.
 * Also, it won't work with importHelpers
 */
function agent() {

    const micGainNodes: GainNode[] = [];
    const gainNodes: GainNode[] = [];
    const analyzerNodes: AnalyserNode[] = [];
    const audioElements: Array<{el: HTMLMediaElement, node: MediaElementAudioSourceNode | null}> = [];
    const mediaStreams: MediaStream[] = [];

    let tabVolume = 0.9;
    let globalContext: AudioContext;

    function captureAudioElement(el: HTMLMediaElement) {
        console.log('element captured');
        let volume = el.volume;
        console.log('initial volume is ' + volume);
        el.volume = tabVolume;

        el.addEventListener('play', () => {
            if (globalContext == null) {
                globalContext = new AudioContext();
            }
            const node = globalContext.createMediaElementSource(el);
            node.connect(globalContext.destination);
        });

        audioElements.push({el, node: null});
    }

    function patchWebAudio() {
        const SavedAudioContext = window.AudioContext;
        class CustomAudioContext extends SavedAudioContext {
            constructor() {
                super();
                console.log('Hello custom context');
                const analyzer = this.createAnalyser();
                const gainNode = this.createGain();
                gainNode.connect(analyzer).connect(this.destination);
                gainNodes.push(gainNode);
                analyzerNodes.push(analyzer);
                // TODO: Free up gain nodes for GC
                Object.defineProperty(this, 'destination', {
                    get: () => gainNode
                });
                globalContext = this;
            }

            createMediaStreamSource(mediaStream: MediaStream) {
                console.log('got microphone access!')
                return SavedAudioContext.prototype.createMediaStreamSource.call(this, mediaStream);
            }

            createMediaElementSource(el: HTMLMediaElement) {
                const result = audioElements.find(audio => audio.el === el);
                if (result != null) {
                    if (result.node == null) {
                        result.node = SavedAudioContext.prototype.createMediaElementSource.call(this, el);
                    }
                    return result.node;
                }
                return SavedAudioContext.prototype.createMediaElementSource.call(this, el);
            }
        }
        window.AudioContext = CustomAudioContext;
    }

    function patchGetUserMedia() {
        const originalUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = function(constraints?: MediaStreamConstraints | undefined) {
            const p = constraints != null ? originalUserMedia.call(navigator.mediaDevices, constraints) : originalUserMedia.call(navigator.mediaDevices);
            return p.then(result => {
                mediaStreams.push(result);
                if (globalContext == null) {
                    globalContext = new AudioContext();
                }
                const src = globalContext.createMediaStreamSource(result);
                const g = globalContext.createGain();
                const dest = globalContext.createMediaStreamDestination();
                src.connect(g).connect(dest);
                result.getAudioTracks().forEach(t => {
                    result.removeTrack(t);
                });
                dest.stream.getAudioTracks().forEach(t => {
                    result.addTrack(t);
                });
                micGainNodes.push(g);
                // TODO: garbage collection
                return result;
            });
        }
    }

    function inspectNewNode(node: Node) {
        if (node instanceof HTMLAudioElement || node instanceof HTMLVideoElement) {
            captureAudioElement(node);
        } else {
            node.childNodes.forEach(inspectNewNode);
        }
    }

    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(inspectNewNode)
            });
        });
        observer.observe((document.body ? document.body : document), {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    patchWebAudio();
    observeDOM();
    patchGetUserMedia();

    Array.from(document.getElementsByTagName('audio')).forEach(captureAudioElement);
    Array.from(document.getElementsByTagName('video')).forEach(captureAudioElement);

    const setVolume = (window as any).setVolume = function(volume: number) {
        tabVolume = volume;
        gainNodes.forEach(g => g.gain.value = volume);
    };

    const setMuted = (window as any).setMuted = function(muted: boolean) {
        const gain = muted ? 0 : 1;
        micGainNodes.forEach(g => g.gain.value = gain);
    };

    (window as any).muteMic = function() {
        // TODO: Not sure which is best, using 'enabled' or gain node on an audio context...
        mediaStreams.forEach(s => s.getAudioTracks().forEach(t => t.enabled = false));
    };
    (window as any).unmuteMic = function() {
        mediaStreams.forEach(s => s.getAudioTracks().forEach(t => t.enabled = true));
    };

    addEventListener('message', (message) => {
        if (message.source != window) {
            return;
        }
        if (message.data.changeVolume != null && typeof message.data.changeVolume === 'number') {
            setVolume(message.data.changeVolume);
        }
        if (message.data.setMuted != null && typeof message.data.setMuted === 'boolean') {
            setMuted(message.data.setMuted);
        }
    });

    function analyze() {
        if (analyzerNodes.length === 0) {
            return 0;
        }
        return analyzerNodes
        .map(a => {
                const buffer = new Uint8Array(a.fftSize);
                a.getByteTimeDomainData(buffer);
                let max = 0.0;
                for (let i = 0 ; i < buffer.length ; i++) {
                    const z = (buffer[i] - 128) / 128.0;
                    const v = Math.log2(1 + Math.abs(z));
                    if (v > max) {
                        max = v;
                    }
                }
                return max;
            })
        .reduce((prev, cur) => prev > cur ? prev : cur, 0);
    }

    let previousValue = 0;
    function analyzeHandler() {
        const value = analyze();
        if (value < 0.01 && previousValue < 0.01) {
            return;
        }
        previousValue = value;
        window.postMessage({ vuMeter: value }, window.location.toString());
    }

    setInterval(analyzeHandler, 100);

    console.log('Méfait accompli');

    // Remove self from the DOM to avoid interfering with logic on the page
    const selfScript = document.getElementById('hmil-tabsmixer-agent');
    selfScript?.parentElement?.removeChild(selfScript);
}

agent();
