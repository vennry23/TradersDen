import React, { lazy, Suspense, useEffect, useState } from 'react';
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
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, summary_card } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const location = useLocation();
    const navigate = useNavigate();
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showSignals, setShowSignals] = useState(false);
    
    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            clear();
            api_base.setIsRunning(false);
        }
    }, [clear, connectionStatus]);

    useEffect(() => {
        if (showAnalysis || showSignals) {
            document.querySelector('.main__run-strategy-wrapper').style.display = 'block';
        } else {
            document.querySelector('.main__run-strategy-wrapper').style.display = '';
        }
    }, [showAnalysis, showSignals]);

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} onTabItemClick={setActiveTab}>
                        <div label='Dashboard'><Dashboard /></div>
                        <div label='Bot Builder'></div>
                        <div label='Charts'>
                            <Suspense fallback={<ChunkLoader message='Loading chart...' />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label='Analysis Tool'>
                            <iframe src='https://your-analysis-tool-url.com' width='100%' height='600px'></iframe>
                            <button onClick={() => setShowAnalysis(!showAnalysis)}>Toggle Analysis</button>
                        </div>
                        <div label='Signals'>
                            <iframe src='https://your-signals-url.com' width='100%' height='600px'></iframe>
                            <button onClick={() => setShowSignals(!showSignals)}>Toggle Signals</button>
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
            <Dialog is_visible={false} />
        </React.Fragment>
    );
});

export default AppWrapper;
