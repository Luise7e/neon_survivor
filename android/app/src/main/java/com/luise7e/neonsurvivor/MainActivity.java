package com.luise7e.neonsurvivor;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.view.WindowManager;
import android.util.Log;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.rewarded.RewardItem;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;

public class MainActivity extends Activity {
    private static final String TAG = "NeonSurvivor";
    private WebView webView;
    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;
    private boolean isAdLoading = false;
    private boolean isRewardedAdLoading = false;
    private AssetServer assetServer;
    private static final int SERVER_PORT = 8080;
    private static final int RC_SIGN_IN = 9001;

    private GoogleSignInClient googleSignInClient;
    private FirebaseAuth firebaseAuth;

    // ID de anuncio intersticial (cambiar a producción en release)
    private static final String AD_UNIT_ID = "ca-app-pub-4698386674302808/7423787962";
    // Para producción: "ca-app-pub-4698386674302808/7423787962"
    // para debug: "ca-app-pub-3940256099942544/1033173712";

    // ID de anuncio con recompensa (test)
    private static final String REWARDED_AD_UNIT_ID = "ca-app-pub-4698386674302808/6466954585";
    //"ca-app-pub-3940256099942544/5224354917"; // Test ID
    // Para producción: usar tu propio ID de AdMob "ca-app-pub-4698386674302808/6466954585";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ❌ NO LIMPIAR CACHE DE LA APP - esto borra localStorage/DOM Storage
        // clearAppCache(); // COMENTADO para preservar sesiones

        // Iniciar servidor HTTP local
        startAssetServer();

        // Mantener pantalla encendida
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Pantalla completa
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        // Inicializar AdMob
        initializeAdMob();

        // Inicializar Firebase Auth
        initializeFirebaseAuth();

        // Configurar WebView
        setupWebView();

        // Manejar deep link si existe
        handleDeepLink(getIntent());
    }

    private void initializeFirebaseAuth() {
        firebaseAuth = FirebaseAuth.getInstance();

        // Configurar Google Sign In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken("843900625599-6opudk964jfvolup0vgnokgb6i2ob9of.apps.googleusercontent.com")
                .requestEmail()
                .build();

        googleSignInClient = GoogleSignIn.getClient(this, gso);

        Log.d(TAG, "✅ Firebase Auth initialized");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        Uri data = intent.getData();
        if (data != null) {
            String url = data.toString();
            Log.d(TAG, "🔗 Deep link received: " + url);

            // Redirigir al WebView para que Firebase maneje el callback
            if (webView != null) {
                webView.loadUrl(url);
            }
        }
    }

    private void startAssetServer() {
        try {
            assetServer = new AssetServer(this, SERVER_PORT);
            assetServer.start();
            Log.d(TAG, "✅ Asset server started on port " + SERVER_PORT);
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start asset server: " + e.getMessage());
        }
    }

    private void clearAppCache() {
        try {
            java.io.File cacheDir = getCacheDir();
            java.io.File appDir = new java.io.File(cacheDir.getParent());
            if (appDir.exists()) {
                String[] children = appDir.list();
                for (String s : children) {
                    if (!s.equals("lib")) {
                        deleteDir(new java.io.File(appDir, s));
                        Log.d(TAG, "🧹 Cleared: " + s);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error clearing app cache: " + e.getMessage());
        }
    }

    private boolean deleteDir(java.io.File dir) {
        if (dir != null && dir.isDirectory()) {
            String[] children = dir.list();
            for (int i = 0; i < children.length; i++) {
                boolean success = deleteDir(new java.io.File(dir, children[i]));
                if (!success) {
                    return false;
                }
            }
            return dir.delete();
        } else if (dir != null && dir.isFile()) {
            return dir.delete();
        } else {
            return false;
        }
    }

    private void initializeAdMob() {
        Log.d(TAG, "Inicializando AdMob...");

        MobileAds.initialize(this, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                Log.d(TAG, "✅ AdMob inicializado correctamente");
                loadInterstitialAd();
                loadRewardedAd();
            }
        });
    }

    private void loadInterstitialAd() {
        if (isAdLoading) {
            Log.d(TAG, "⚠️ Anuncio ya está cargando...");
            return;
        }

        isAdLoading = true;
        Log.d(TAG, "📺 Cargando anuncio intersticial...");

        AdRequest adRequest = new AdRequest.Builder().build();

        InterstitialAd.load(this, AD_UNIT_ID, adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull InterstitialAd ad) {
                    interstitialAd = ad;
                    isAdLoading = false;
                    Log.d(TAG, "✅ Anuncio intersticial cargado");
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    interstitialAd = null;
                    isAdLoading = false;
                    Log.e(TAG, "❌ Error cargando anuncio: " + loadAdError.getMessage());
                }
            });
    }

    private void loadRewardedAd() {
        if (isRewardedAdLoading) {
            Log.d(TAG, "⚠️ Anuncio con recompensa ya está cargando...");
            return;
        }

        isRewardedAdLoading = true;
        Log.d(TAG, "🎁 Cargando anuncio con recompensa...");

        AdRequest adRequest = new AdRequest.Builder().build();

        RewardedAd.load(this, REWARDED_AD_UNIT_ID, adRequest,
            new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull RewardedAd ad) {
                    rewardedAd = ad;
                    isRewardedAdLoading = false;
                    Log.d(TAG, "✅ Anuncio con recompensa cargado");
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                    rewardedAd = null;
                    isRewardedAdLoading = false;
                    Log.e(TAG, "❌ Error cargando anuncio con recompensa: " + loadAdError.getMessage());
                }
            });
    }

    private void setupWebView() {
        webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);

        // ✅ CRÍTICO: Habilitar DOM Storage para localStorage
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);

        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // ⚠️ CAMBIADO: No usar LOAD_NO_CACHE para permitir que localStorage persista
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Hardware acceleration
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

        // ⚠️ LIMPIEZA INICIAL SOLO UNA VEZ - NO en cada carga
        // Solo limpiar cache HTTP/recursos, NO DOM Storage
        webView.clearCache(true); // Solo al inicio
        webView.clearHistory();

        // NO borrar formData ya que puede afectar localStorage
        // webView.clearFormData(); // COMENTADO

        Log.d(TAG, "🧹 WebView HTTP cache cleared - localStorage preserved!");

        // Interface JavaScript para mostrar anuncios y autenticación
        webView.addJavascriptInterface(new AdMobInterface(), "Android");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Ya no interceptamos URLs de Google OAuth
                // El login se maneja nativamente
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "✅ Página cargada: " + url);

                // Notificar a JavaScript que AdMob está listo
                webView.evaluateJavascript(
                    "if (typeof onAdMobReady === 'function') onAdMobReady();",
                    null
                );
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                // ❌ NO LIMPIAR CACHE AQUÍ - esto borra localStorage en cada carga
                // view.clearCache(true); // ELIMINADO
                Log.d(TAG, "🔄 Page loading (localStorage preserved)");
            }
        });

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        }

        // Cargar el juego desde servidor HTTP local
        long timestamp = System.currentTimeMillis();
        String url = "http://localhost:" + SERVER_PORT + "/index.html?v=4.0.1&t=" + timestamp;
        Log.d(TAG, "📱 Loading URL: " + url);
        webView.loadUrl(url);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                Log.d(TAG, "✅ Google Sign In successful: " + account.getEmail());

                // Enviar el Google ID Token directamente al WebView (NO el Firebase token)
                String googleIdToken = account.getIdToken();
                Log.d(TAG, "🔑 Google ID Token obtained (length: " + googleIdToken.length() + ")");
                notifyWebViewWithGoogleToken(googleIdToken);

            } catch (ApiException e) {
                Log.e(TAG, "❌ Google Sign In failed: " + e.getMessage());
                notifyWebViewAuthResult(false, "Google Sign In failed: " + e.getMessage());
            }
        }
    }

    private void notifyWebViewWithGoogleToken(String googleIdToken) {
        // Enviar el token de Google (NO de Firebase) para que JavaScript lo procese
        String js = String.format(
            "console.log('🟢 [Android] Sending Google ID Token to JS');" +
            "if (window.firebaseHandler && typeof window.firebaseHandler.signInWithGoogleCredential === 'function') {" +
            "  window.firebaseHandler.signInWithGoogleCredential('%s');" +
            "  console.log('✅ [Android] signInWithGoogleCredential called');" +
            "} else {" +
            "  console.error('❌ [Android] window.firebaseHandler.signInWithGoogleCredential not found');" +
            "}",
            googleIdToken.replace("'", "\\'")
        );

        webView.evaluateJavascript(js, null);
        Log.d(TAG, "✅ Google ID Token sent to WebView");
    }

    // Método obsoleto - ya no autenticamos desde Android
    private void firebaseAuthWithGoogle(GoogleSignInAccount account) {
        Log.d(TAG, "⚠️ firebaseAuthWithGoogle - DEPRECATED (auth now handled in JavaScript)");
    }

    private void notifyWebViewAuthSuccess(FirebaseUser user, String idToken) {
        String photoUrl = user.getPhotoUrl() != null ? user.getPhotoUrl().toString() : "";
        String displayName = user.getDisplayName() != null ? user.getDisplayName() : "";

        // ✅ CORREGIDO: Llamar a la función correcta en firebase-handler.js
        String js = String.format(
            "console.log('🟢 [Android] Sending idToken to JS:', '%s');" +
            "if (window.firebaseHandler && typeof window.firebaseHandler.signInWithGoogleCredential === 'function') {" +
            "  window.firebaseHandler.signInWithGoogleCredential('%s');" +
            "  console.log('✅ [Android] signInWithGoogleCredential called');" +
            "} else {" +
            "  console.error('❌ [Android] window.firebaseHandler.signInWithGoogleCredential not found');" +
            "}",
            idToken.substring(0, Math.min(20, idToken.length())) + "...",
            idToken.replace("'", "\\'")
        );

        webView.evaluateJavascript(js, null);
        Log.d(TAG, "✅ Auth idToken sent to WebView");
    }

    private void notifyWebViewAuthResult(boolean success, String message) {
        String js = String.format(
            "if (typeof onNativeAuthResult === 'function') {" +
            "  onNativeAuthResult(%b, '%s');" +
            "}",
            success,
            message.replace("'", "\\'")
        );

        webView.evaluateJavascript(js, null);
    }

    private void openInCustomTab(String url) {
        try {
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
            builder.setShowTitle(true);
            builder.setUrlBarHidingEnabled(false);

            CustomTabsIntent customTabsIntent = builder.build();
            customTabsIntent.launchUrl(this, Uri.parse(url));

            Log.d(TAG, "✅ Custom Tab opened successfully");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error opening Custom Tab: " + e.getMessage());
            // Fallback: abrir en navegador externo
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        }
    }

    // Interface para JavaScript
    public class AdMobInterface {
        @JavascriptInterface
        public void vibrate(int duration) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                        if (vibrator != null && vibrator.hasVibrator()) {
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                                // API 26+: Usar VibrationEffect
                                vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE));
                            } else {
                                // API < 26: Método legacy
                                vibrator.vibrate(duration);
                            }
                            Log.d(TAG, "📳 Vibration triggered: " + duration + "ms");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Error vibrating: " + e.getMessage());
                    }
                }
            });
        }

        @JavascriptInterface
        public void showInterstitial() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (interstitialAd != null) {
                        Log.d(TAG, "📺 Mostrando anuncio intersticial");
                        interstitialAd.show(MainActivity.this);

                        // Cargar el siguiente anuncio
                        interstitialAd = null;
                        loadInterstitialAd();
                    } else {
                        Log.d(TAG, "⚠️ Anuncio no disponible, cargando...");
                        loadInterstitialAd();
                    }
                }
            });
        }

        @JavascriptInterface
        public void showRewardedAd() {
            showRewardedAdWithCallback("onAdRewarded");
        }

        @JavascriptInterface
        public void showRewardedAdForContinue() {
            showRewardedAdWithCallback("onAdRewardedContinue");
        }

        private void showRewardedAdWithCallback(final String callbackName) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (rewardedAd != null) {
                        Log.d(TAG, "🎁 Mostrando anuncio con recompensa (callback: " + callbackName + ")");
                        rewardedAd.show(MainActivity.this, new OnUserEarnedRewardListener() {
                            @Override
                            public void onUserEarnedReward(@NonNull RewardItem rewardItem) {
                                // Usuario completó el anuncio - otorgar recompensa
                                Log.d(TAG, "✅ Usuario obtuvo recompensa: " + rewardItem.getAmount() + " " + rewardItem.getType());

                                // Notificar a JavaScript que el anuncio se completó
                                webView.evaluateJavascript(
                                    "if (typeof " + callbackName + " === 'function') " + callbackName + "();",
                                    null
                                );
                            }
                        });

                        // Cargar el siguiente anuncio
                        rewardedAd = null;
                        loadRewardedAd();
                    } else {
                        Log.d(TAG, "⚠️ Anuncio con recompensa no disponible, cargando...");
                        loadRewardedAd();

                        // En modo test, simular recompensa inmediatamente
                        if (REWARDED_AD_UNIT_ID.contains("3940256099942544")) {
                            Log.d(TAG, "🧪 TEST MODE: Simulando recompensa");
                            webView.evaluateJavascript(
                                "if (typeof " + callbackName + " === 'function') " + callbackName + "();",
                                null
                            );
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public boolean isAdReady() {
            return interstitialAd != null;
        }

        @JavascriptInterface
        public boolean isRewardedAdReady() {
            return rewardedAd != null;
        }

        @JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Log.d(TAG, "🔐 Starting Google Sign In...");
                    Intent signInIntent = googleSignInClient.getSignInIntent();
                    startActivityForResult(signInIntent, RC_SIGN_IN);
                }
            });
        }

        @JavascriptInterface
        public void signOut() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Log.d(TAG, "👋 Signing out...");
                    firebaseAuth.signOut();
                    googleSignInClient.signOut();
                    notifyWebViewAuthResult(true, "Signed out");
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onDestroy() {
        if (assetServer != null) {
            assetServer.stop();
            Log.d(TAG, "🛑 Asset server stopped");
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
