import { BackgroundListener } from 'background/background-listener';
import { AppStorage } from 'background/state/app-storage';
import { ContentInterface } from 'content/content-interface';

const storage = new AppStorage();
const content = new ContentInterface();
const listener = new BackgroundListener(storage, content);
listener.init();
