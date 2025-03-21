import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
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

const DashboardIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
);

const BotBuilderIcon = () => (
   <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon">
<g id="Vector">
<path d="M4.86145 15.2219H7.04631C6.8442 15.4184 6.73304 15.6744 6.73304 15.944C6.7381 16.529 7.25852 16.9997 7.90525 16.9997C8.19831 16.9997 8.48125 16.8991 8.69852 16.7163C9.17346 16.3187 9.19872 15.6515 8.75915 15.2219H10.8802C11.1739 15.2219 11.412 14.9832 11.412 14.6886L11.4141 13.1466C11.621 13.3386 11.8904 13.4442 12.1743 13.4442C12.7902 13.4394 13.2857 12.9451 13.2857 12.3308C13.2857 12.0524 13.1799 11.7836 12.9874 11.5773C12.5688 11.1261 11.8664 11.1021 11.4141 11.5197L11.412 8.99984L8.75914 8.99992C9.19871 9.4295 9.17345 10.0967 8.69851 10.4943C8.48124 10.6771 8.1983 10.7777 7.90524 10.7777C7.25851 10.7777 6.73809 10.3069 6.73303 9.72199C6.73303 9.45235 6.84419 9.19643 7.0463 8.99992L4.86145 8.99984V15.2219Z" stroke="var(--fill-color1)" stroke-width="0.8"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.05657 2.77774C6.61699 2.34816 6.64225 1.68093 7.1172 1.28334C7.33446 1.10054 7.61741 1 7.91046 1C8.5572 1 9.07762 1.47071 9.08267 2.05568C9.08267 2.32531 8.97151 2.58123 8.76941 2.77774L11.4222 2.77774V5.29738C11.2153 5.10547 10.9459 4.99992 10.6621 4.99992C10.0462 5.00472 9.55066 5.49904 9.55066 6.11335C9.55066 6.3917 9.65651 6.66046 9.84896 6.86683C10.2675 7.31793 10.9699 7.34195 11.4222 6.92451V8.99984H8.76928C9.20886 9.42942 9.1836 10.0966 8.70865 10.4942C8.49139 10.677 8.20844 10.7776 7.91539 10.7776C7.26866 10.7776 6.74823 10.3069 6.74318 9.7219C6.74318 9.45227 6.85434 9.19635 7.05644 8.99984H4.87159L4.87159 6.92442C4.41933 7.34196 3.71688 7.31796 3.2983 6.86683C3.10585 6.66046 3 6.3917 3 6.11335C3 5.49904 3.49556 5.00472 4.11141 4.99992C4.39527 4.99992 4.66471 5.1055 4.87159 5.29747L4.87159 3.31106C4.87159 3.01652 5.10971 2.77774 5.40344 2.77774L7.05657 2.77774Z" stroke="var(--fill-color1)" stroke-width="0.8"/>
</g>
</g>
</svg>
);

const ChartsIcon = () => (
    <svg width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m3.5 13 3-3.5L10 13l6.5-6.5" stroke="var(--fill-color1)" stroke-linecap="round"/><path d="M1 1v15a1 1 0 0 0 1 1h15" stroke="var(--fill-color1)" stroke-linecap="round"/></svg>
);

const TutorialsIcon = () => (
   <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon">
<rect id="Rectangle 533" x="1" y="0.5" width="15" height="11" rx="0.5" stroke="#333333"/>
<path id="Polygon 1" d="M11.75 5.56699C12.0833 5.75944 12.0833 6.24056 11.75 6.43301L7.25 9.03109C6.91667 9.22354 6.5 8.98298 6.5 8.59808L6.5 3.40192C6.5 3.01702 6.91667 2.77646 7.25 2.96891L11.75 5.56699Z" stroke="var(--fill-color1)"/>
<line id="Line 1" x1="1" y1="14.5" x2="5" y2="14.5" stroke="var(--fill-color1)" stroke-linecap="round"/>
<line id="Line 2" x1="8" y1="14.5" x2="16" y2="14.5" stroke="var(--fill-color1)" stroke-linecap="round"/>
<circle id="Ellipse 23" cx="5" cy="14.5" r="1.5" fill="var(--fill-color1)"/>
</g>
</svg>
);

const AnalysisToolIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M3 3h2v2H3zm4 0h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM3 7h2v2H3zm16 0h2v2h-2zm-4 0h2v2h-2zm-8 8h2v2H11zm4 0h2v2h-2zm4 0h2v2h-2zm-12 0h2v2H3zm0 4h2v2H3zm4 0h2v2H7zm12-4h2v2h-2zm-4 0h2v2h-2zm4 4h2v2h-2z" />
    </svg>
);

const SignalsIcon = () => (
    <svg width="24px" height="24px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">

<g fill="none" fill-rule="evenodd">

<path d="m0 0h32v32h-32z"/>

<path d="m16 23.3333333c.7054971 0 1.3378647.3131046 1.7657251.8079361-.5364679.4639137-1.1239266.9712419-1.7657251 1.5255163-.6383398-.5591127-1.2226122-1.0708429-1.7573994-1.5392067.4304214-.4865055 1.0579721-.7942457 1.7573994-.7942457zm0-5.6666666c2.3048894 0 4.4576506 1.2009433 5.704885 3.0752846-.4130934.3552245-.9166883.7900247-1.5310671 1.3205162-.8551473-1.4455488-2.4631903-2.3958008-4.1738179-2.3958008-1.6939811 0-3.2935514.9375716-4.153541 2.3633155-.6104727-.535199-1.1109102-.9732794-1.5210712-1.3322518 1.2518588-1.8474905 3.3914515-3.0310637 5.6746122-3.0310637zm.0064666-5.8333334c3.6910267 0 7.7501479 2.2543887 9.7175152 5.4253088-.7374102.6387525-1.2199186 1.0573621-1.5362933 1.3321302-1.5123244-2.7101472-5.0642122-4.757439-8.1812219-4.757439-3.0920156 0-6.62217548 2.0244039-8.15333066 4.7080787-.3127146-.2753249-.79333049-.6962176-1.52619224-1.3382492 1.98147431-3.140502 6.0163913-5.3698295 9.6795229-5.3698295zm.0032333-5.8333333c5.4911176 0 11.2324815 3.15266123 14.167125 7.4001118-.5539993.4804544-1.0599156.9185988-1.5234281 1.3200576-2.5144049-3.7988077-7.7353145-6.7201694-12.6436969-6.7201694-4.8664206 0-10.02085911 2.8700013-12.59269965 6.655398-.45802592-.4033711-.96136471-.8444698-1.51080184-1.3259792 2.98225947-4.22806264 8.65545979-7.3294188 14.10350149-7.3294188z" fill="var(--fill-color1)"/>

</g>

</svg>
);

const TradingHubIcon = () => (
    <svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 width="24px" height="824px" viewBox="0 0 512 512"  xml:space="preserve">
<style type="text/css">
<![CDATA[
	.st0{fill:var(--text-general);}
]]>
</style>
<g>
	<path class="st0" d="M476.235,174.734c2.203-8.547-2.953-17.266-11.516-19.484l-57.579-14.781l50.61-27.672
		c7.75-4.234,10.594-13.969,6.359-21.719s-13.969-10.594-21.719-6.344l-64.063,35.047l39.219-95.25
		c0.469-1.156,0.453-2.469-0.078-3.609c-0.516-1.141-1.5-2.016-2.688-2.422c0,0-31.688-16.438-49.594-16.438
		c-37.063,0-73.047,19.422-105.828,19.422c-9.906,0-19.531-1.781-28.797-6.422C208.797,4.188,189.797,0,171.829,0
		c-27.172,0-75.313,18.766-75.313,18.766c-1.266,0.313-2.344,1.172-2.938,2.359c-0.594,1.172-0.656,2.547-0.156,3.766L136.61,129.75
		c-5.328,2.625-9.016,8.031-9.016,14.344c0,5.438,2.734,10.234,6.891,13.125c-21.109,25.156-73.156,92.547-92.75,167.031
		C13.454,431.703,76.516,512,255.407,512c178.907,0,241.954-80.297,213.688-187.75c-17.297-65.688-59.829-125.875-84.11-156.438
		l71.782,18.438C465.313,188.453,474.032,183.297,476.235,174.734z M171.829,40c13.078,0,26.047,3.453,40.844,10.844
		c14.109,7.063,29.828,10.641,46.688,10.641c21.266,0,41.078-5.438,60.25-10.688c16.391-4.5,31.859-8.734,45.578-8.734l1.875,0.031
		l-35.406,86H179.172L144.61,44.125C154.11,41.547,163.032,40,171.829,40z M430.407,334.438c9.5,36.063,5.922,65.219-10.594,86.656
		C394.5,453.922,336.125,472,255.407,472C174.704,472,116.313,453.922,91,421.094c-16.516-21.438-20.078-50.594-10.594-86.656
		c21.906-83.25,91.859-159.766,92.531-160.5l12.844-13.844h139.266l12.844,13.844C338.594,174.703,408.36,250.656,430.407,334.438z"
		/>
	<path class="st0" d="M287.672,311.563c0,0,4.625-3.563,8.219-5.844c3.578-2.313,6.547-4.875,8.875-7.688
		c2.344-2.828,4.047-5.859,5.172-9.094c1.109-3.25,1.656-6.641,1.656-10.188c0-6.203-1.109-11.781-3.328-16.734
		s-5.703-9.172-10.484-12.641c-4.781-3.5-10.891-6.172-18.328-8.047c-5.844-1.484-12.656-2.359-20.375-2.672v-16.469h-25.406V238.5
		h-31.969h-10.484v12.281c0,3.625-0.266,5.813,3.438,6.547c0.328,0.047,0.797,0.141,1.406,0.234
		c0.594,0.109,1.703,0.281,3.313,0.563c1.594,0.281-0.453,0.641,2.328,1.094v109.703c-2.781,0.469-0.734,0.828-2.328,1.109
		c-1.609,0.25-2.719,0.438-3.313,0.547c-0.609,0.109-1.078,0.188-1.406,0.25c-3.703,0.734-3.438,2.922-3.438,6.531v12.281h10.484
		h31.969v15.297h25.406v-15.297h3.266c9.328,0,17.625-1.109,24.875-3.328c7.25-2.25,13.359-5.313,18.313-9.266
		c4.969-3.922,8.75-8.625,11.344-14.047c2.578-5.438,3.891-11.359,3.891-17.766C320.766,327.453,309.719,316.234,287.672,311.563z
		 M231.579,260.25h20.938c10.078,0,17.469,1.656,22.219,5c4.734,3.344,7.109,8.969,7.109,16.844c0,7.594-2.641,13.141-7.891,16.609
		c-5.25,3.484-12.953,5.234-23.094,5.234h-19.281V260.25z M285.985,353.484c-1.016,2.797-2.641,5.219-4.891,7.328
		c-2.266,2.063-5.266,3.75-9,5s-8.391,1.891-13.938,1.891h-26.578v-44.328h26.469c5.25,0,9.734,0.5,13.438,1.469
		s6.734,2.375,9.109,4.219c2.359,1.859,4.109,4.094,5.219,6.703s1.656,5.547,1.656,8.828
		C287.469,347.734,286.969,350.703,285.985,353.484z"/>
</g>
</svg>
);

const FreeBotsIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M2 21h19v-3H2v3zM20 3H4v10l8 5 8-5V3zm-8 4.5c-1.11 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2z" />
    </svg>
);

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useStore();
    const {
        active_tab,
        is_chart_modal_visible,
        is_trading_view_modal_visible,
        setActiveTab,
    } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick, stopBot } = run_panel;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

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
        // Fetch the XML files and parse them
        const fetchBots = async () => {
            const botFiles = [
                'test1.xml',
                'test2.xml',
                // Add more paths to your XML files
            ];
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
                        title: file.split('/').pop(), // Use the file name as the title
                        image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
                        filePath: file,
                        xmlContent: text, // Store the XML content
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

    const runBot = (xmlContent: string) => {
        // Load the strategy into the bot builder
        updateWorkspaceName(xmlContent);
        console.log('Running bot with content:', xmlContent);
    };

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);
        },
        [setActiveTab]
    );

    const handleBotClick = useCallback(async (bot: { filePath: string; xmlContent: string }) => {
        setActiveTab(DBOT_TABS.BOT_BUILDER);
        try {
            if (typeof load_modal.loadFileFromContent === 'function') {
                await load_modal.loadFileFromContent(bot.xmlContent);
            } else {
                console.error("loadFileFromContent is not defined on load_modal");
            }
            updateWorkspaceName(bot.xmlContent);
        } catch (error) {
            console.error("Error loading bot file:", error);
        }
    }, [setActiveTab, updateWorkspaceName, load_modal]);

    const handleOpen = useCallback(async () => {
        await load_modal.loadFileFromRecent();
        setActiveTab(DBOT_TABS.BOT_BUILDER);
        // rudderStackSendDashboardClickEvent({ dashboard_click_name: 'open', subpage_name: 'bot_builder' });
    }, [load_modal, setActiveTab]);

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemChange={onEntered} onTabItemClick={handleTabChange} top>
                        <div label={<><DashboardIcon /><Localize i18n_default_text='Dashboard' /></>} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                            <button onClick={handleOpen}>Load Bot</button>
                        </div>
                        <div label={<><BotBuilderIcon /><Localize i18n_default_text='Bot Builder' /></>} id='id-bot-builder' />
                        <div label={<><ChartsIcon /><Localize i18n_default_text='Charts' /></>} id='id-charts'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label={<><TutorialsIcon /><Localize i18n_default_text='Tutorials' /></>} id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}>
                                <Tutorial handleTabChange={handleTabChange} />
                            </Suspense>
                        </div>
                        <div label={<><AnalysisToolIcon /><Localize i18n_default_text='Analysis Tool' /></>} id='id-analysis-tool'>
                            <iframe src='https://binaryfx.site/api_binaryfx' width='100%' height='500px' frameBorder='0'></iframe>
                        </div>
                        <div label={<><SignalsIcon /><Localize i18n_default_text='Signals' /></>} id='id-signals'>
                            <iframe src='signals' width='100%' height='500px' frameBorder='0'></iframe>
                        </div>
                        <div label={<><TradingHubIcon /><Localize i18n_default_text='Trading Hub' /></>} id='id-Trading-Hub'>
                            <iframe src='https://binaryfx.site/acc-center' width='100%' height='500px' frameBorder='0'></iframe>
                        </div>
                        <div label={<><FreeBotsIcon /><Localize i18n_default_text='Free Bots' /></>} id='id-free-bots'>
                            <div className='free-bots'>
                                <h2 className='free-bots__heading'><Localize i18n_default_text='Free Bots' /></h2>
                                <ul className='free-bots__content'>
                                    {bots.map((bot, index) => (
                                        <li className='free-bot' key={index} onClick={() => {
                                            handleBotClick(bot);
                                        }}>
                                            <img src={bot.image} alt={bot.title} className='free-bot__image' />
                                            <div className='free-bot__details'>
                                                <h3 className='free-bot__title'>{bot.title}</h3>
                                            </div>
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
