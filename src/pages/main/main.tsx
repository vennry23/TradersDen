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
import { useStore } from '@/hooks/useStore';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const AppWrapper = observer(() => {
    const { dashboard, run_panel, summary_card } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick } = run_panel;
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const location = useLocation();
    const navigate = useNavigate();

    const handleTabChange = (tab_index) => {
        setActiveTab(tab_index);
        navigate(`#${TAB_IDS[tab_index] || TAB_IDS[0]}`);
    };

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemClick={handleTabChange} top>
                        <div label='Dashboard' id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                        </div>
                        <div label='Bot Builder' id='id-bot-builder' />
                        <div label='Charts' id='id-charts'>
                            <Suspense fallback={<ChunkLoader message='Please wait, loading chart...' />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label='Analysis Tool' id='id-analysis-tool'>
                            <iframe src='https://binaryfx.site/api_binaryfx' width='100%' height='600px' title='Analysis Tool'></iframe>
                        </div>
                        <div label='Signals' id='id-signals'>
                            <iframe src='https://binaryfx.site/signals' width='100%' height='600px' title='Signals'></iframe>
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
            <MobileWrapper>
                <RunPanel />
            </MobileWrapper>
            <Dialog
                cancel_button_text={dialog_options.cancel_button_text || 'Cancel'}
                confirm_button_text={dialog_options.ok_button_text || 'Ok'}
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                title={dialog_options.title}
            >
                {dialog_options.message}
            </Dialog>
        </React.Fragment>
    );
});

export default AppWrapper;
