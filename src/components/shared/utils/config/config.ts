export const APP_IDS = {
    LOCALHOST: 68848,
    STAGING: 29934,
    PRODUCTION: 65555,
    LIVE: 68848,
};

export const domain_app_ids: Record<string, number> = {
    'bot.binaryfx.site': APP_IDS.LIVE,
    'staging-dbot.deriv.com': APP_IDS.STAGING,
    'dbot.deriv.com': APP_IDS.PRODUCTION,
};

export const getAppId = (): string => {
    const correct_app_id = APP_IDS.LIVE.toString();
    let app_id = window.localStorage.getItem('config.app_id');

    if (!app_id || app_id !== correct_app_id) {
        console.warn("⚠️ App ID is incorrect. Setting to:", correct_app_id);
        app_id = correct_app_id;
        window.localStorage.setItem('config.app_id', app_id);
    }

    console.log("✅ [config.ts] Using App ID:", app_id);
    return app_id;
};

export const getOAuthURL = (): string => {
    const app_id = getAppId();
    return `https://oauth.deriv.com/oauth2/authorize?app_id=${app_id}`;
};

export const redirectToLogin = (): void => {
    const oauthUrl = getOAuthURL();

    console.log("🔄 Redirecting to:", oauthUrl);
    window.location.href = oauthUrl;
};

