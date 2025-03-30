export { handleError, initErrorHandlingListener, removeErrorHandlingEventListener } from './error-handling';
export { importExternal } from './html-helper';
export { observer } from './observer';
export { compareXml, extractBlocksFromXml, pipe, sortBlockChild } from './strategy-helper';
export { LogTypes, runReport } from './trade-reporter';
export {
    addDomAsBlock,
    cleanUpOnLoad,
    delayExecution,
    disable,
    download,
    enable,
    excludeOptionFromContextMenu,
    isCustomDialog,
    isDialogType,
    isMainBlock,
    load,
    loadBlocks,
    loadWorkspace,
    notify,
    save,
    showIncompatibleStrategyDialog,
} from './utils';
export { onWorkspaceResize } from './workspace';

export const save = (filename = '@deriv/bot', collection = false, xmlDom) => {
    xmlDom.setAttribute('is_dbot', 'true');
    xmlDom.setAttribute('collection', collection ? 'true' : 'false');

    const data = XmlHelper.saveBotFormat(window.Blockly.Xml.domToPrettyText(xmlDom), { filename, collection });
    saveAs({ data, type: 'application/octet-stream', filename: `${filename}.bfx` });
};

export const load = async ({ block_string, file_name, workspace }) => {
    let xml;
    try {
        const file_extension = file_name.split('.').pop().toLowerCase();
        if (file_extension === 'bfx') {
            const botFormat = XmlHelper.loadBotFormat(block_string);
            xml = window.Blockly.utils.xml.textToDom(botFormat.blocksXml);
        } else {
            xml = window.Blockly.utils.xml.textToDom(block_string);
        }
    } catch (e) {
        console.error('Error loading file:', e);
        return;
    }

    workspace.clear();
    window.Blockly.Xml.domToWorkspace(xml, workspace);
};
