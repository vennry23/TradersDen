import { XmlHelper } from '@/XmlHelper';
// ...existing imports...

export const saveWorkspaceToRecent = async (workspace, save_type = save_types.UNSAVED) => {
    const {
        load_modal: { updateListStrategies },
        save_modal,
    } = DBotStore.instance;

    const workspace_id = window.Blockly.derivWorkspace.current_strategy_id || window.Blockly.utils.idGenerator.genUid();
    let botContent;

    if (typeof workspace === 'string') {
        botContent = workspace;
    } else {
        const xml_dom = convertStrategyToIsDbot(workspace);
        botContent = Blockly.Xml.domToText(xml_dom);
    }

    const current_timestamp = Date.now();
    const current_workspace_index = workspaces.findIndex(ws => ws.id === workspace_id);

    if (current_workspace_index >= 0) {
        const current_workspace = workspaces[current_workspace_index];
        current_workspace.xml = botContent;
        current_workspace.name = save_modal.bot_name;
        current_workspace.timestamp = current_timestamp;
        current_workspace.save_type = save_type;
    } else {
        workspaces.push({
            id: workspace_id,
            timestamp: current_timestamp,
            name: save_modal.bot_name || config().default_file_name,
            xml: botContent,
            save_type,
        });
    }

    workspaces
        .sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        })
        .reverse();

    if (workspaces.length > 10) {
        workspaces.pop();
    }
    updateListStrategies(workspaces);
    localForage.setItem('saved_workspaces', LZString.compress(JSON.stringify(workspaces)));
};
