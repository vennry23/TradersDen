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
    const init_render = React.useRef(true);
    const hash = ['dashboard', 'bot_builder', 'chart', 'tutorial', 'analysis', 'signals'];
    const location = useLocation();
    const navigate = useNavigate();

    let tab_value = active_tab;
    const GetHashedValue = (tab) => {
        tab_value = location.hash?.split('#')[1];
        if (!tab_value) return tab;
        return Number(hash.indexOf(String(tab_value)));
    };
    const active_hash_tab = GetHashedValue(active_tab);

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            clear();
            api_base.setIsRunning(false);
        }
    }, [clear, connectionStatus]);

    useEffect(() => {
        if (init_render.current) {
            setActiveTab(Number(active_hash_tab));
            init_render.current = false;
        } else {
            navigate(`#${hash[active_tab] || hash[0]}`);
        }
    }, [active_tab]);

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} onTabItemClick={setActiveTab}>
                        <div label='Dashboard' id='id-dbot-dashboard'>
                            <Dashboard />
                        </div>
                        <div label='Bot Builder' id='id-bot-builder' />
                        <div label='Charts' id='id-charts'>
                            <Suspense fallback={<ChunkLoader message='Loading chart...' />}>
                                <Chart />
                            </Suspense>
                        </div>
                        <div label='Tutorials' id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message='Loading tutorials...' />}>
                                <Tutorial />
                            </Suspense>
                        </div>
                        <div label='Analysis Tool' id='id-analysis'>
                            <iframe src='https://binaryfx.site/api_binaryfx' width='100%' height='600px'></iframe>
                        </div>
                        <div label='Signals' id='id-signals'>
                            <iframe src='https://binaryfx.site/signals' width='100%' height='600px'></iframe>
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
            <Dialog is_visible={false} title='Dialog' />
        </React.Fragment>
    );
});

export default AppWrapper;
