import { website_name } from '@/utils/site-config';
import { getAppId, domain_app_ids } from '../config/config';  // ✅ Ensure correct imports
import { CookieStorage, isStorageSupported, LocalStore } from '../storage/storage';
import { getStaticUrl, urlForCurrentDomain } from '../url';
import { deriv_urls } from '../url/constants';

export const redirectToLogin = (is_logged_in: boolean, language: string, has_params = true, redirect_delay = 0) => {
    if (!is_logged_in && isStorageSupported(sessionStorage)) {
        const l = window.location;
        const redirect_url = has_params ? window.location.href : `${l.protocol}//${l.host}${l.pathname}`;
        sessionStorage.setItem('redirect_url', redirect_url);
        setTimeout(() => {
            const new_href = loginUrl({ language });
            window.location.href = new_href;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    window.open(getStaticUrl('/signup/'));
};

type TLoginUrl = {
    language: string;
};

export const loginUrl = ({ language }: TLoginUrl) => {
    let app_id = getAppId(); // ✅ Ensure correct App ID is used

    // ✅ Force correct App ID if it's incorrect
    if (!app_id || app_id === '36300') {
        app_id = '68848'; // Replace with your correct app_id
        localStorage.setItem('config.app_id', app_id);
        console.log("Updated App ID:", app_id);
    }

    const server_url = LocalStore.get('config.server_url');
    const signup_device = new (CookieStorage as any)('signup_device').get('signup_device');
    const date_first_contact = new (CookieStorage as any)('date_first_contact').get('date_first_contact');

    const marketing_queries = `${signup_device ? `&signup_device=${signup_device}` : ''}${
        date_first_contact ? `&date_first_contact=${date_first_contact}` : ''
    }`;

    const getOAuthUrl = () => {
        return `https://oauth.${
            deriv_urls.DERIV_HOST_NAME
        }/oauth2/authorize?app_id=${app_id}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    };

    if (server_url && /qa/.test(server_url)) {
        return `https://${server_url}/oauth2/authorize?app_id=${app_id}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    }

    if (app_id === domain_app_ids[window.location.hostname as keyof typeof domain_app_ids]) {
        return getOAuthUrl();
    }

    return urlForCurrentDomain(getOAuthUrl());
};
