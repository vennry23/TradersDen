import localForage from 'localforage';
import LZString from 'lz-string';
import CryptoJS from 'crypto-js';
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

const ENCRYPTION_KEY = '94532412'; // Replace with a secure key

export default class SaveModalStore {
    root_store;

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
        if (!this.is_save_modal_open) {
            this.setButtonStatus(button_status.NORMAL);
        }
        this.is_save_modal_open = !this.is_save_modal_open;
    };

    validateBotName = (values) => {
        const errors = {};
        if (values.bot_name.trim() === '') {
            errors.bot_name = localize('Strategy name cannot be empty');
        }
        return errors;
    };

    encryptXML = (xmlContent) => {
        return CryptoJS.AES.encrypt(xmlContent, ENCRYPTION_KEY).toString();
    };

    triggerDownload = (filename, content) => {
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    onConfirmSave = async ({ is_local, save_as_collection, bot_name }) => {
        const { load_modal, dashboard, google_drive } = this.root_store;
        const { loadStrategyToBuilder, selected_strategy } = load_modal;
        const { active_tab } = dashboard;

        this.setButtonStatus(button_status.LOADING);
        const { saveFile } = google_drive;

        let xml;
        let main_strategy = null;

        if (active_tab === 1) {
            xml = window.Blockly?.Xml?.workspaceToDom(window.Blockly?.derivWorkspace);
        } else {
            const recent_files = await getSavedWorkspaces();
            main_strategy = recent_files.find((strategy) => strategy.id === selected_strategy.id);
            if (main_strategy) {
                main_strategy.name = bot_name;
                main_strategy.save_type = is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE;
                xml = window.Blockly.utils.xml.textToDom(main_strategy.xml);
            }
        }

        xml.setAttribute('is_dbot', 'true');
        xml.setAttribute('collection', save_as_collection ? 'true' : 'false');

        const xmlString = Blockly?.Xml?.domToPrettyText(xml);
        const encryptedXML = this.encryptXML(xmlString);

        if (is_local) {
            this.triggerDownload(`${bot_name}.txt`, encryptedXML); // Downloads encrypted XML as a text file
        } else {
            await saveFile({
                name: bot_name,
                content: encryptedXML,
                mimeType: 'application/octet-stream',
            });
            this.setButtonStatus(button_status.COMPLETED);
        }

        this.updateBotName(bot_name);

        if (active_tab === 0) {
            const workspace_id = selected_strategy.id ?? Blockly?.utils?.genUid();
            await this.addStrategyToWorkspace(workspace_id, is_local, save_as_collection, bot_name, xml);
            if (main_strategy) await loadStrategyToBuilder(main_strategy);
        } else {
            await saveWorkspaceToRecent(xml, is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE);
        }

        this.toggleSaveModal();
    };

    updateBotName = (bot_name) => {
        this.bot_name = bot_name;
    };

    onDriveConnect = async () => {
        const { google_drive } = this.root_store;
        google_drive.is_authorised ? google_drive.signOut() : google_drive.signIn();
    };

    setButtonStatus = (status) => {
        this.button_status = status;
    };
}
