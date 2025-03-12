import React, { lazy, Suspense, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import {
    LabelPairedChartLineCaptionRegularIcon,
    LabelPairedObjectsColumnCaptionRegularIcon,
    LabelPairedPuzzlePieceTwoCaptionBoldIcon,
} from '@deriv/quill-icons/LabelPaired';
import { LegacyGuide1pxIcon } from '@deriv/quill-icons/Legacy';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useStore();
    const { active_tab, is_chart_modal_visible, is_trading_view_modal_visible, setActiveTab } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick } = run_panel;
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const init_render = React.useRef(true);
    const hash = ['dashboard', 'bot_builder', 'chart', 'tutorial', 'analysis_tool', 'signals'];
    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

    let tab_value = active_tab;
    const GetHashedValue = (tab) => {
        tab_value = location.hash?.split('#')[1];
        return tab_value ? Number(hash.indexOf(String(tab_value))) : tab;
    };
    const active_hash_tab = GetHashedValue(active_tab);

    React.useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            clear();
            api_base.setIsRunning(false);
        }
    }, [clear, connectionStatus]);

    React.useEffect(() => {
        if (init_render.current) {
            setActiveTab(Number(active_hash_tab));
            init_render.current = false;
        } else {
            navigate(`#${hash[active_tab] || hash[0]}`);
        }
    }, [active_tab]);

    const handleTabChange = React.useCallback(
        (tab_index) => {
            setActiveTab(tab_index);
            const el_id = TAB_IDS[tab_index];
            if (el_id) {
                document.getElementById(el_id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        [active_tab]
    );

    return (
        <>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemChange={onEntered} onTabItemClick={handleTabChange} top>
                        <div label={<Localize i18n_default_text='Dashboard' />} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                        </div>
                        <div label={<Localize i18n_default_text='Bot Builder' />} id='id-bot-builder' />
                        <div label={<Localize i18n_default_text='Charts' />} id='id-charts'>
                            <Suspense fallback={<ChunkLoader message={localize('Loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label={<Localize i18n_default_text='Tutorials' />} id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message={localize('Loading tutorials...')} />}>
                                <Tutorial handleTabChange={handleTabChange} />
                            </Suspense>
                        </div>
                        <div label={<Localize i18n_default_text='Analysis Tool' />} id='id-analysis-tool'>
                            <iframe src='https://binaryfx.site/api_binaryfx' width='100%' height='600px' frameBorder='0'></iframe>
                        </div>
                        <div label={<Localize i18n_default_text='Signals' />} id='id-signals'>
                            <iframe src='https://binaryfx.site/signals' width='100%' height='600px' frameBorder='0'></iframe>
                        </div>
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className='main__run-strategy-wrapper' style={{ display: 'flex' }}>
                    <RunStrategy />
                    <RunPanel />
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>
                <RunPanel />
            </MobileWrapper>
            <Dialog cancel_button_text={dialog_options.cancel_button_text || localize('Cancel')} confirm_button_text={dialog_options.ok_button_text || localize('Ok')} is_visible={is_dialog_open} onCancel={onCancelButtonClick} onClose={onCloseDialog} onConfirm={onOkButtonClick || onCloseDialog}>
                {dialog_options.message}
            </Dialog>
        </>
    );
});

export default AppWrapper;
