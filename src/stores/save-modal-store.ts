import localForage from 'localforage';
import LZString from 'lz-string';
import { action, makeObservable, observable } from 'mobx';
import { MAX_STRATEGIES } from '@/constants/bot-contents';
import { button_status } from '@/constants/button-status';
import {
    getSavedWorkspaces,
    observer as globalObserver,
    save,
    save_types,
    saveWorkspaceToRecent,
} from '@/external/bot-skeleton';
import { localize } from '@deriv-com/translations';
import { TStrategy } from 'Types';
import RootStore from './root-store';

type IOnConfirmProps = {
    is_local: boolean;
    save_as_collection: boolean;
    bot_name: string;
};

interface ISaveModalStore {
    is_save_modal_open: boolean;
    button_status: { [key: string]: string } | number;
    bot_name: { [key: string]: string } | string;
    toggleSaveModal: () => void;
    validateBotName: (values: string) => { [key: string]: string };
    onConfirmSave: ({ is_local, save_as_collection, bot_name }: IOnConfirmProps) => void;
    updateBotName: (bot_name: string) => void;
    setButtonStatus: (status: { [key: string]: string } | string | number) => void;
}

const Blockly = window.Blockly;

export default class SaveModalStore implements ISaveModalStore {
    root_store: RootStore;

    constructor(root_store: RootStore) {
        makeObservable(this, {
            is_save_modal_open: observable,
            button_status: observable,
            bot_name: observable,
            toggleSaveModal: action.bound,
            validateBotName: action.bound,
            onConfirmSave: action.bound,
            updateBotName: action.bound,
            onDriveConnect: action.bound,
            setButtonStatus: action.bound,
        });

        this.root_store = root_store;
    }

    is_save_modal_open = false;
    button_status = button_status.NORMAL;
    bot_name = '';

    toggleSaveModal = (): void => {
        if (!this.is_save_modal_open) {
            this.setButtonStatus(button_status.NORMAL);
        }
        this.is_save_modal_open = !this.is_save_modal_open;
    };

    validateBotName = (values: string): { [key: string]: string } => {
        const errors = {};
        if (values.bot_name.trim() === '') {
            errors.bot_name = localize('Strategy name cannot be empty');
        }
        return errors;
    };

    // Pure JavaScript SHA-256 implementation
    sha256 = (ascii) => {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }

        let mathPow = Math.pow;
        let maxWord = mathPow(2, 32);
        let words = [];
        let asciiBitLength = ascii.length * 8;
        let hash = [], k = [], primeCounter = k.length;
        let isComposite = {};

        for (let candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
                hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }

        ascii += '\x80';
        while ((ascii.length % 64) - 56) ascii += '\x00';

        for (let i = 0; i < ascii.length; i++) {
            words[i >> 2] |= ascii.charCodeAt(i) << (((3 - i) % 4) * 8);
        }

        words[words.length] = (asciiBitLength / maxWord) | 0;
        words[words.length] = asciiBitLength;

        for (let j = 0; j < words.length; ) {
            let w = words.slice(j, (j += 16));
            let oldHash = hash.slice(0);

            for (let i = 0; i < 64; i++) {
                let w15 = w[i - 15], w2 = w[i - 2];
                let a = hash[0], e = hash[4];
                let temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
                            ((e & hash[5]) ^ (~e & hash[6])) + k[i] + (w[i] = i < 16 ? w[i] :
                            (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
                            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);

                let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
                            ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
            }

            for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
        }

        return hash.map(h => ('00000000' + h.toString(16)).slice(-8)).join('');
    };

    onConfirmSave = async ({ is_local, save_as_collection, bot_name }: IOnConfirmProps) => {
        const { load_modal, dashboard, google_drive } = this.root_store;
        this.setButtonStatus(button_status.LOADING);
        const { saveFile } = google_drive;

        let xml = Blockly.Xml.workspaceToDom(Blockly.derivWorkspace);
        xml.setAttribute('is_dbot', 'true');
        xml.setAttribute('collection', save_as_collection ? 'true' : 'false');

        // Generate SHA-256 hash and add it to XML
        const xmlText = Blockly.Xml.domToText(xml);
        const hash = this.sha256(xmlText);
        xml.setAttribute('signature', hash);

        if (is_local) {
            save(bot_name, save_as_collection, xml);
        } else {
            await saveFile({
                name: bot_name,
                content: Blockly.Xml.domToPrettyText(xml),
                mimeType: 'application/xml',
            });
            this.setButtonStatus(button_status.COMPLETED);
        }

        this.updateBotName(bot_name);
        await saveWorkspaceToRecent(xml, is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE);
        this.toggleSaveModal();
    };

    updateBotName = (bot_name: string): void => {
        this.bot_name = bot_name;
    };

    onDriveConnect = async () => {
        const { google_drive } = this.root_store;
        if (google_drive.is_authorised) {
            google_drive.signOut();
        } else {
            google_drive.signIn();
        }
    };

    setButtonStatus = (status: { [key: string]: string } | string | number) => {
        this.button_status = status;
    };
}
