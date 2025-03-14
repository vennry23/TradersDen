import React from 'react';
import { action, computed, makeObservable, observable, reaction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js'; // Import CryptoJS for decryption
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

export default class LoadModalStore {
    root_store: any;
    core: TStores;
    imported_strategy_type = 'pending';
    encryptionKey = '94532412'; // Set your decryption key here

    constructor(root_store: any, core: any) {
        makeObservable(this, {
            active_index: observable,
            is_load_modal_open: observable,
            loaded_local_file: observable,
            recent_strategies: observable,
            selected_strategy_id: observable,
            preview_workspace: computed,
            selected_strategy: computed,
            tab_name: computed,
            setOpenButtonDisabled: action.bound,
            loadFileFromLocal: action.bound,
            handleFileChange: action.bound,
            readFile: action.bound,
        });

        this.root_store = root_store;
        this.core = core;

        reaction(
            () => this.is_load_modal_open,
            async is_open => {
                if (is_open) {
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

    recent_workspace: window.Blockly.WorkspaceSvg | null = null;
    local_workspace: window.Blockly.WorkspaceSvg | null = null;
    active_index = 0;
    is_load_modal_open = false;
    loaded_local_file: File | null = null;
    recent_strategies: Array<TStrategy> = [];
    selected_strategy_id = '';

    get preview_workspace(): window.Blockly.WorkspaceSvg | null {
        return this.tab_name === 'Local' ? this.local_workspace : this.recent_workspace;
    }

    get selected_strategy(): TStrategy {
        return this.recent_strategies.find(ws => ws.id === this.selected_strategy_id) || this.recent_strategies[0];
    }

    get tab_name(): string {
        return this.active_index === 0 ? 'Recent' : 'Local';
    }

    setOpenButtonDisabled = (is_disabled: boolean) => {
        this.is_open_button_disabled = is_disabled;
    };

    setRecentStrategies = (strategies: Array<TStrategy>) => {
        this.recent_strategies = strategies;
    };

    setSelectedStrategyId = (strategy_id: string) => {
        this.selected_strategy_id = strategy_id;
    };

    loadFileFromLocal = (): void => {
        if (this.loaded_local_file) {
            this.readFile(this.loaded_local_file);
        }
    };

    handleFileChange = (event: React.ChangeEvent<HTMLInputElement> | DragEvent): void => {
        let files;
        if (event.type === 'drop') {
            event.preventDefault();
            files = (event as DragEvent).dataTransfer?.files;
        } else {
            files = (event.target as HTMLInputElement).files;
        }

        if (files && files.length > 0) {
            const file = files[0];
            this.setLoadedLocalFile(file);
            this.readFile(file);
        }
    };

    readFile = (file: File): void => {
        const reader = new FileReader();
        const file_name = file.name.replace(/\.[^/.]+$/, '') || '';

        reader.onload = action(async e => {
            try {
                const encryptedText = e?.target?.result as string;

                // Decrypt the file content
                const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
                const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

                if (!decryptedText) {
                    throw new Error('Decryption failed: Invalid key or corrupted file.');
                }

                const load_options = {
                    block_string: decryptedText,
                    from: save_types.LOCAL,
                    workspace: null,
                    file_name,
                    strategy_id: '',
                    showIncompatibleStrategyDialog: false,
                };

                if (this.local_workspace) {
                    this.local_workspace.dispose();
                    this.local_workspace = null;
                }

                this.loadStrategyOnModalLocalPreview(load_options);
            } catch (error) {
                console.error('Error decrypting file:', error);
                alert('Failed to decrypt the file. Please check your encryption key.');
            }
        });

        reader.readAsText(file);
    };

    loadStrategyOnModalLocalPreview = async (load_options: any) => {
        const injectOptions = { ...inject_workspace_options, theme: window.Blockly.Themes.zelos_renderer };

        const ref_preview = document.getElementById('load-strategy__blockly-container');
        if (!this.local_workspace) {
            this.local_workspace = window.Blockly.inject(ref_preview, injectOptions);
        }

        load_options.workspace = this.local_workspace;

        if (load_options.workspace) {
            (load_options.workspace as any).RTL = isDbotRTL();
        }

        await load(load_options);
    };

    setLoadedLocalFile = (file: File | null) => {
        this.loaded_local_file = file;
    };
}
