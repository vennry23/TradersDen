import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import { getInitialLanguage } from '@deriv-com/translations';
import APIMiddleware from './api-middleware';

const APP_ID = 68848; // ✅ Fixed App ID
const SOCKET_URL = 'wss://ws.binaryfx.site/websockets/v3'; // ✅ Fixed Socket URL

export const generateDerivApiInstance = () => {
    const socket_url = `${SOCKET_URL}?app_id=${APP_ID}&l=${getInitialLanguage()}&brand=bot.binaryfx.site`;
    const deriv_socket = new WebSocket(socket_url);
    const deriv_api = new DerivAPIBasic({
        connection: deriv_socket,
        middleware: new APIMiddleware({}),
    });
    return deriv_api;
};

export const getLoginId = () => {
    const login_id = localStorage.getItem('active_loginid');
    return login_id && login_id !== 'null' ? login_id : null;
};

export const V2GetActiveToken = () => {
    const token = localStorage.getItem('authToken');
    return token && token !== 'null' ? token : null;
};

export const V2GetActiveClientId = () => {
    const token = V2GetActiveToken();
    if (!token) return null;

    const account_list = JSON.parse(localStorage.getItem('accountsList') || '{}');
    return Object.keys(account_list).find(key => account_list[key] === token) || null;
};

export const getToken = () => {
    const active_loginid = getLoginId();
    const client_accounts = JSON.parse(localStorage.getItem('accountsList') || '{}');
    const active_account = client_accounts?.[active_loginid] || {};
    
    return {
        token: active_account || undefined,
        account_id: active_loginid || undefined,
    };
};
