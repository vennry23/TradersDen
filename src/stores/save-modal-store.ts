import React from 'react';
import { action, computed, makeObservable, observable, reaction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import {
    getSavedWorkspaces,
    load,
    removeExistingWorkspace,
    save_types,
    saveWorkspaceToRecent,
} from '@/external/bot-skeleton';
import { inject_workspace_options, updateXmlValues } from '@/external/bot-skeleton/scratch/utils';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { TStores } from '@deriv/stores/types';
import { localize } from '@deriv-com/translations';
import { TStrategy } from 'Types';
import {
    rudderStackSendUploadStrategyCompletedEvent,
    rudderStackSendUploadStrategyFailedEvent,
    rudderStackSendUploadStrategyStartEvent,
} from '../analytics/rudderstack-common-events';
import { getStrategyType } from '../analytics/utils';
import { tabs_title } from '../constants/load-modal';
import { waitForDomElement } from '../utils/dom-observer';
import RootStore from './root-store';

export default class LoadModalStore {
    root_store: RootStore;
    core: TStores;
    imported_strategy_type = 'pending';

    constructor(root_store: RootStore, core: any) {
        makeObservable(this, {
            is_load_modal_open: observable,
            loaded_local_file: observable,
            recent_strategies: observable,
            selected_strategy_id: observable,
            setLoadedLocalFile: action.bound,
            setRecentStrategies: action.bound,
            setSelectedStrategyId: action.bound,
            toggleLoadModal: action.bound,
            handleFileChange: action.bound,
            readFile: action.bound,
        });

        this.root_store = root_store;
        this.core = core;

        reaction(
            () => this.is_load_modal_open,
            async is_load_modal_open => {
                if (is_load_modal_open) {
                    const saved_workspaces = await getSavedWorkspaces();
                    if (!saved_workspaces) return;
                    this.setRecentStrategies(saved_workspaces);
                    if (saved_workspaces.length > 0 && !this.selected_strategy_id) {
                        this.setSelectedStrategyId(saved_workspaces[0].id);
                    }
                }
            }
        );
    }

    is_load_modal_open = false;
    loaded_local_file: File | null = null;
    recent_strategies: Array<TStrategy> = [];
    selected_strategy_id = '';

    setLoadedLocalFile = (loaded_local_file: File | null): void => {
        this.loaded_local_file = loaded_local_file;
    };

    setRecentStrategies = (recent_strategies: TStrategy[]): void => {
        this.recent_strategies = recent_strategies;
    };

    setSelectedStrategyId = (selected_strategy_id: string): void => {
        this.selected_strategy_id = selected_strategy_id;
    };

    toggleLoadModal = (): void => {
        this.is_load_modal_open = !this.is_load_modal_open;
        this.setLoadedLocalFile(null);
    };

    handleFileChange = (event: React.FormEvent<HTMLFormElement> | DragEvent): boolean => {
        this.imported_strategy_type = 'pending';
        this.upload_id = uuidv4();
        let files;

        if (event.type === 'drop') {
            event.stopPropagation();
            event.preventDefault();
            ({ files } = event.dataTransfer as DragEvent);
        } else {
            ({ files } = event.target);
        }

        const [file] = files;

        if (file.name.includes('xml')) {
            this.setLoadedLocalFile(file);
        } else {
            return false;
        }

        this.readFile(event as DragEvent, file);
        (event.target as HTMLInputElement).value = '';
        return true;
    };

    readFile = (drop_event: DragEvent, file: File): void => {
        const reader = new FileReader();
        const file_name = file?.name.replace(/\.[^/.]+$/, '') || '';
        const encryptionKey = '94532412'; // Replace with your actual key

        reader.onload = action(async e => {
            try {
                const encryptedText = e?.target?.result as string;

                // Decrypt the file content
                const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
                const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

                if (!decryptedText) {
                    throw new Error('Decryption failed: Invalid key or corrupted file.');
                }

                const load_options = {
                    block_string: decryptedText,
                    drop_event,
                    from: save_types.LOCAL,
                    workspace: null as window.Blockly.WorkspaceSvg | null,
                    file_name,
                    strategy_id: '',
                    showIncompatibleStrategyDialog: false,
                };

                this.loadStrategyOnModalLocalPreview(load_options);
            } catch (error) {
                console.error('Error decrypting file:', error);
                alert('Failed to decrypt the file. Please ensure you have the correct key.');
            }
        });

        reader.readAsText(file);
    };

    loadStrategyOnModalLocalPreview = async load_options => {
        const injectWorkspace = { ...inject_workspace_options, theme: window?.Blockly?.Themes?.zelos_renderer };

        await waitForDomElement('#load-strategy__blockly-container');
        const ref_preview = document.getElementById('load-strategy__blockly-container');
        const local_workspace = await window.Blockly.inject(ref_preview, injectWorkspace);

        load_options.workspace = local_workspace;
        if (load_options.workspace) {
            (load_options.workspace as any).RTL = isDbotRTL();
        }

        const upload_type = getStrategyType(load_options?.block_string ?? '');
        const result = await load(load_options);

        if (!result?.error) {
            rudderStackSendUploadStrategyStartEvent({ upload_provider: 'my_computer', upload_id: this.upload_id });
        } else {
            rudderStackSendUploadStrategyFailedEvent({
                upload_provider: 'my_computer',
                upload_id: this.upload_id,
                upload_type,
                error_message: result.error,
            });
        }
    };
}
