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

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash.toString(16);
}

function downloadFile(filename, content) {
    console.log(`Downloading file: ${filename}`);
    const blob = new Blob([content], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default class SaveModalStore {
    constructor(root_store) {
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

    toggleSaveModal = () => {
        console.log('Toggling save modal');
        this.is_save_modal_open = !this.is_save_modal_open;
    };

    validateBotName = (values) => {
        console.log('Validating bot name:', values);
        const errors = {};
        if (values.trim() === '') {
            errors.bot_name = localize('Strategy name cannot be empty');
        }
        return errors;
    };

    onConfirmSave = async ({ is_local, save_as_collection, bot_name }) => {
        console.log('Starting save process:', { is_local, save_as_collection, bot_name });
        this.setButtonStatus(button_status.LOADING);
        const { load_modal, dashboard, google_drive } = this.root_store;
        const { selected_strategy } = load_modal;
        const { active_tab } = dashboard;
        let xml;

        if (active_tab === 1) {
            xml = window.Blockly.Xml.workspaceToDom(window.Blockly.derivWorkspace);
        } else {
            const recent_files = await getSavedWorkspaces();
            const main_strategy = recent_files.find(s => s.id === selected_strategy.id);
            if (main_strategy) {
                console.log('Loading existing strategy:', main_strategy);
                xml = window.Blockly.utils.xml.textToDom(main_strategy.xml);
            }
        }

        xml.setAttribute('signature', simpleHash(window.Blockly.Xml.domToPrettyText(xml)));
        const xmlContent = window.Blockly.Xml.domToPrettyText(xml);
        console.log('Generated XML Content:', xmlContent);

        if (is_local) {
            downloadFile(`${bot_name}.xml`, xmlContent);
        } else {
            console.log('Saving to Google Drive');
            await google_drive.saveFile({ name: bot_name, content: xmlContent, mimeType: 'application/xml' });
            this.setButtonStatus(button_status.COMPLETED);
        }
        this.updateBotName(bot_name);
        this.toggleSaveModal();
    };

    updateBotName = (bot_name) => {
        console.log('Updating bot name:', bot_name);
        this.bot_name = bot_name;
    };

    onDriveConnect = async () => {
        console.log('Handling Drive connection');
        const { google_drive } = this.root_store;
        if (google_drive.is_authorised) {
            google_drive.signOut();
        } else {
            google_drive.signIn();
        }
    };

    setButtonStatus = (status) => {
        console.log('Setting button status:', status);
        this.button_status = status;
    };
}
