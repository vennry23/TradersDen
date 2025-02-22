export const redirectToLogin = (is_logged_in: boolean, redirect_delay = 0) => {
    if (!is_logged_in) {
        console.log("🔹 User is not logged in. Redirecting...");

        const redirect_url = window.location.href;
        sessionStorage.setItem('redirect_url', redirect_url);

        setTimeout(() => {
            const login_url = getLoginUrl();
            console.log("🔄 Redirecting to login:", login_url);
            window.location.href = login_url;
        }, redirect_delay);
    }
};

const getLoginUrl = (): string => {
    // ✅ Forces the correct OAuth URL with app_id=68848
    const oauth_url = `https://oauth.deriv.com/oauth2/authorize?app_id=68848`;

    console.log("✅ Final Login URL:", oauth_url);
    return oauth_url;
};
