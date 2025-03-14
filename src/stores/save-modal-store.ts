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
        hash |= 0; // Convert to 32-bit integer
    }
    return hash.toString(16);
}

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
        if (values.trim() === '') {
            errors.bot_name = localize('Strategy name cannot be empty');
        }
        return errors;
    };

    addStrategyToWorkspace = async (workspace_id: string, is_local: boolean, save_as_collection: boolean, bot_name: string, xml: string) => {
        try {
            const workspace = await getSavedWorkspaces();
            const current_workspace_index = workspace.findIndex((strategy: TStrategy) => strategy.id === workspace_id);
            const local_type = is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE;
            const save_collection = save_as_collection ? save_types.UNSAVED : local_type;
            const type = save_collection;
            const save_type = type.toLowerCase();

            const workspace_structure = {
                id: workspace_id,
                xml: window.Blockly.Xml.domToText(xml),
                name: bot_name,
                timestamp: Date.now(),
                save_type,
                signature: simpleHash(xml),
            };

            if (current_workspace_index >= 0) {
                workspace[current_workspace_index] = workspace_structure;
            } else {
                workspace.push(workspace_structure);
            }

            workspace.sort((a: TStrategy, b: TStrategy) => b.timestamp - a.timestamp);
            if (workspace.length > MAX_STRATEGIES) {
                workspace.pop();
            }

            localForage.setItem('saved_workspaces', LZString.compress(JSON.stringify(workspace)));
            const updated_strategies = await getSavedWorkspaces();
            this.root_store.load_modal.setRecentStrategies(updated_strategies);
            this.root_store.dashboard.setStrategySaveType(save_type);
        } catch (error) {
            globalObserver.emit('Error', error);
        }
    };

    onConfirmSave = async ({ is_local, save_as_collection, bot_name }: IOnConfirmProps) => {
        this.setButtonStatus(button_status.LOADING);
        const { load_modal, dashboard, google_drive } = this.root_store;
        const { loadStrategyToBuilder, selected_strategy } = load_modal;
        const { active_tab } = dashboard;
        let xml;
        let main_strategy = null;

        if (active_tab === 1) {
            xml = window.Blockly.Xml.workspaceToDom(window.Blockly.derivWorkspace);
        } else {
            const recent_files = await getSavedWorkspaces();
            main_strategy = recent_files.find((strategy: TStrategy) => strategy.id === selected_strategy.id) || null;
            if (main_strategy) {
                main_strategy.name = bot_name;
                main_strategy.save_type = is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE;
                xml = window.Blockly.utils.xml.textToDom(main_strategy.xml);
            }
        }

        xml.setAttribute('is_dbot', 'true');
        xml.setAttribute('collection', save_as_collection ? 'true' : 'false');
        xml.setAttribute('signature', simpleHash(Blockly.Xml.domToPrettyText(xml)));

        if (is_local) {
            save(bot_name, save_as_collection, xml);
        } else {
            await google_drive.saveFile({
                name: bot_name,
                content: Blockly.Xml.domToPrettyText(xml),
                mimeType: 'application/xml',
            });
            this.setButtonStatus(button_status.COMPLETED);
        }

        this.updateBotName(bot_name);

        if (active_tab === 0) {
            const workspace_id = selected_strategy.id ?? Blockly.utils.genUid();
            await this.addStrategyToWorkspace(workspace_id, is_local, save_as_collection, bot_name, xml);
            if (main_strategy) await loadStrategyToBuilder(main_strategy);
        } else {
            await saveWorkspaceToRecent(xml, is_local ? save_types.LOCAL : save_types.GOOGLE_DRIVE);
        }
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
