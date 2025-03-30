export { setColors } from '../scratch/hooks/colours';
export { getContractTypeName } from './contract';
export { timeSince } from './date-time-helper';
export { createError, trackAndEmitError } from './error';
export { handleError, initErrorHandlingListener, removeErrorHandlingEventListener } from './error-handling';
export { importExternal } from './html-helper';
export { getSavedWorkspaces, removeExistingWorkspace, saveWorkspaceToRecent, convertStrategyToIsDbot } from './local-storage';
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
