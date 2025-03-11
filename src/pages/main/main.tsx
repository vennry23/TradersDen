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
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { LabelPairedChartLineCaptionRegularIcon, LabelPairedObjectsColumnCaptionRegularIcon, LabelPairedPuzzlePieceTwoCaptionBoldIcon } from '@deriv/quill-icons/LabelPaired';
import { LegacyGuide1pxIcon } from '@deriv-quill-icons/Legacy';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const AnalysisIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M3 3v18h18' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
        <path d='M7 14l3-3 3 3 4-4 3 3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
    </svg>
);

const SignalIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M4 12h16M4 6h16M4 18h16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
    </svg>
);

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { is_open } = quick_strategy;
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();
    const hash = ['dashboard', 'bot_builder', 'chart', 'tutorial', 'analysis_tool', 'signals'];

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            clear();
            api_base.setIsRunning(false);
        }
    }, [clear, connectionStatus]);

    useEffect(() => {
        navigate(`#${hash[active_tab] || hash[0]}`);
    }, [active_tab]);

    const handleTabChange = (tab_index) => {
        setActiveTab(tab_index);
    };

    return (
        <>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemClick={handleTabChange} top>
                        <div label={<><LabelPairedObjectsColumnCaptionRegularIcon height='24px' width='24px' /><Localize i18n_default_text='Dashboard' /></>} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                        </div>
                        <div label={<><LabelPairedPuzzlePieceTwoCaptionBoldIcon height='24px' width='24px' /><Localize i18n_default_text='Bot Builder' /></>} id='id-bot-builder' />
                        <div label={<><LabelPairedChartLineCaptionRegularIcon height='24px' width='24px' /><Localize i18n_default_text='Charts' /></>} id='id-charts'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}><Chart show_digits_stats={false} /></Suspense>
                        </div>
                        <div label={<><LegacyGuide1pxIcon height='16px' width='16px' /><Localize i18n_default_text='Tutorials' /></>} id='id-tutorials'>
                            <div className='tutorials-wrapper'><Suspense fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}><Tutorial handleTabChange={handleTabChange} /></Suspense></div>
                        </div>
                        <div label={<><AnalysisIcon /><Localize i18n_default_text='Analysis Tool' /></>} id='id-analysis-tool'>
                            <iframe src='https://your-analysis-tool-url.com' title='Analysis Tool' className='iframe-container' style={{ width: '100%', height: '100%', border: 'none' }} />
                        </div>
                        <div label={<><SignalIcon /><Localize i18n_default_text='Signals' /></>} id='id-signals'>
                            <iframe src='https://your-signals-url.com' title='Signals' className='iframe-container' style={{ width: '100%', height: '100%', border: 'none' }} />
                        </div>
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    <RunPanel />
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>{!is_open && <RunPanel />}</MobileWrapper>
        </>
    );
});

export default AppWrapper;
