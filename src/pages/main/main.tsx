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
    const { active_tab, setActiveTab } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick, stopBot } = run_panel;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options;
    const { clear } = summary_card;
    const { isDesktop } = useDevice();
    
    const [bots, setBots] = useState([]);

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
            }
        }
    }, [clear, connectionStatus, stopBot]);

    useEffect(() => {
        const fetchBots = async () => {
            const botFiles = ['test1.xml', 'test2.xml'];
            const botPromises = botFiles.map(async (file) => {
                try {
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
                    }
                    const text = await response.text();
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'application/xml');
                    return {
                        title: file.split('/').pop(),
                        image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
                        filePath: file,
                    };
                } catch (error) {
                    console.error(error);
                    return null;
                }
            });
            const bots = (await Promise.all(botPromises)).filter(Boolean);
            setBots(bots);
        };

        fetchBots();
    }, []);

    const handleBotClick = async (filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
            }
            const text = await response.text();
            updateWorkspaceName(text);
            setActiveTab(TAB_IDS.BOT_BUILDER);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemChange={onEntered} top>
                        <div label={<Localize i18n_default_text='Dashboard' />} id='id-dbot-dashboard'>
                            <Dashboard />
                        </div>
                        <div label={<Localize i18n_default_text='Bot Builder' />} id='id-bot-builder' />
                        <div label={<Localize i18n_default_text='Free Bots' />} id='id-free-bots'>
                            <div className='free-bots'>
                                <h2><Localize i18n_default_text='Free Bots' /></h2>
                                <ul>
                                    {bots.map((bot, index) => (
                                        <li key={index} onClick={() => handleBotClick(bot.filePath)}>
                                            <img src={bot.image} alt={bot.title} />
                                            <h3>{bot.title}</h3>
                                        </li>
                                    ))}
                                </ul>
                            </div>
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
            <Dialog cancel_button_text={cancel_button_text || localize('Cancel')} confirm_button_text={ok_button_text || localize('Ok')} has_close_icon is_visible={is_dialog_open} onCancel={onCancelButtonClick} onClose={onCloseDialog} onConfirm={onOkButtonClick || onCloseDialog} title={title}>
                {message}
            </Dialog>
        </React.Fragment>
    );
});

export default AppWrapper;
