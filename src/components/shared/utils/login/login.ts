export const redirectToLogin = () => {
    const oauthUrl = "https://oauth.deriv.com/oauth2/authorize?app_id=68848";
    
    console.log("🔄 Redirecting to:", oauthUrl);

    window.location.href = oauthUrl;
};


const getLoginUrl = (): string => {
    // ✅ Forces the correct OAuth URL with app_id=68848
    const oauth_url = `https://oauth.deriv.com/oauth2/authorize?app_id=68848`;

    console.log("✅ Final Login URL:", oauth_url);
    return oauth_url;
};
