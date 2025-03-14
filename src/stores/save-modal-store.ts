import localForage from 'localforage';
import LZString from 'lz-string';
import { action, makeObservable, observable } from 'mobx';
import { MAX_STRATEGIES } from '@/constants/bot-contents';
import { button_status } from '@/constants/button-status';
import {
    getSavedWorkspaces,
    observer as globalObserver,
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
    bot_name: string;
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
        if (values.trim() === '') {
            errors.bot_name = localize('Strategy name cannot be empty');
        }
        return errors;
    };

    /**
     * Custom function to save strategy in .bfxs format
     */
    saveCustomFile = (bot_name: string, xml: XMLDocument) => {
        if (!xml) {
            console.error('Error: XML is undefined');
            return;
        }

        const xmlText = Blockly.Xml.domToText(xml); // Convert XML to string
        console.log('XML String:', xmlText); // Debugging

        if (!xmlText) {
            console.error('Error: XML text is empty');
            return;
        }

        const encodedData = LZString.compressToBase64(xmlText); // Compress
        console.log('Compressed Data:', encodedData); // Debugging

        if (!encodedData) {
            console.error('Error: Compression failed');
            return;
        }

        try {
            const blob = new Blob([encodedData], { type: 'application/octet-stream' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${bot_name}.bfxs`; // Custom file extension
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log('Download triggered for:', a.download);
        } catch (error) {
            console.error('File save error:', error);
        }
    };

    /**
     * Handles save confirmation
     */
    onConfirmSave = async ({ is_local, save_as_collection, bot_name }: IOnConfirmProps) => {
        this.setButtonStatus(button_status.LOADING);

        let xml;
        try {
            xml = Blockly.Xml.workspaceToDom(Blockly.derivWorkspace);
        } catch (error) {
            console.error('Error getting workspace XML:', error);
            this.setButtonStatus(button_status.ERROR);
            return;
        }

        if (!xml) {
            console.error('Error: XML is null or undefined');
            this.setButtonStatus(button_status.ERROR);
            return;
        }

        console.log('Raw XML Document:', xml);

        xml.setAttribute('is_dbot', 'true');
        xml.setAttribute('collection', save_as_collection ? 'true' : 'false');

        if (is_local) {
            this.saveCustomFile(bot_name, xml);
        }

        this.updateBotName(bot_name);
        this.toggleSaveModal();
    };

    updateBotName = (bot_name: string): void => {
        this.bot_name = bot_name;
    };

    setButtonStatus = (status: { [key: string]: string } | string | number) => {
        this.button_status = status;
    };
}
