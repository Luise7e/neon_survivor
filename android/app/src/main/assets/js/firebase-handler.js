/* ===================================
   FIREBASE HANDLER - AUTH & FIRESTORE
   ================================== */

class FirebaseHandler {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.maxLevelReached = 1;
        this.isGuestMode = false;
    }

    /**
     * Initialize Firebase
     */
    init() {
        try {
            firebase.initializeApp(FIREBASE_CONFIG);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            console.log('✅ Firebase initialized');

            // Setup auth state listener
            this.setupAuthStateListener();
        } catch (error) {
            console.error('❌ Firebase initialization error:', error);
        }
    }

    /**
     * Setup authentication state listener
     */
    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            console.log('🟡 [AuthStateChanged] Valor de user:', user);
            if (user) {
                console.log('🟢 [AuthStateChanged] Usuario autenticado:', user.email || user.displayName, user.uid);
                this.handleUserLogin(user);
            } else {
                // Don't logout if we have a saved session being restored
                const hasSavedSession = localStorage.getItem('neonSurvivorUser');
                console.log('🔴 [AuthStateChanged] Sin usuario autenticado. ¿Hay sesión en localStorage?', !!hasSavedSession);
                if (!hasSavedSession) {
                    this.handleUserLogout();
                } else {
                    console.log('⚠️ Firebase auth null but localStorage has session - keeping UI');
                }
            }
        });
    }

    /**
     * Sign in with Google Credential (Android native)
     * Llamar desde Android con el idToken tras login exitoso
     */
    async signInWithGoogleCredential(idToken) {
        try {
            console.log('🔵 [signInWithGoogleCredential] Recibido idToken:', idToken ? idToken.substring(0, 20) + '...' : 'NULL');
            const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
            const result = await this.auth.signInWithCredential(credential);
            console.log('🟢 [signInWithGoogleCredential] Resultado:', result);
            if (result && result.user) {
                console.log('🟢 [signInWithGoogleCredential] Usuario autenticado:', result.user.email || result.user.displayName, result.user.uid);
            } else {
                console.warn('🟠 [signInWithGoogleCredential] No se obtuvo usuario tras login.');
            }
        } catch (error) {
            console.error('❌ Error en signInWithGoogleCredential:', error);
            alert('Error al autenticar con Google/Firebase: ' + error.message);
        }
    }

    /**
     * Handle user login
     */
    async handleUserLogin(user) {
        this.currentUser = user;
        this.isGuestMode = false;
        window.isGuestMode = false;

        // Guardar sesión en localStorage
        try {
            localStorage.setItem('neonSurvivorUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                providerId: user.providerId || (user.providerData && user.providerData[0] ? user.providerData[0].providerId : null)
            }));
            console.log('💾 Sesión guardada en localStorage:', user.uid);
        } catch (e) {
            console.error('❌ Error guardando sesión en localStorage:', e);
        }

        console.log('✅ User logged in:', user.email || user.displayName, user.uid);

        // Load user data from Firestore
        await this.loadUserData(user.uid);

        // Update UI
        this.updateUIForLoggedInUser(user);
    }

    /**
     * Handle user logout
     */
    handleUserLogout() {
        this.currentUser = null;
        console.log('👋 User logged out');

        // Update UI
        this.updateUIForLoggedOutUser();
    }

    /**
     * Load user data from Firestore
     */
    async loadUserData(uid) {
        try {
            const docRef = this.db.collection('users').doc(uid);
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data();
                this.maxLevelReached = data.maxLevelReached || 1;
                GAME_SETTINGS.currentAvatarData = data.avatar || null;
                console.log('📊 User data loaded:', data);
            } else {
                // Create new user document
                await this.createUserDocument(uid);
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
        }
    }

    /**
     * Create new user document in Firestore
     */
    async createUserDocument(uid) {
        try {
            const defaultAvatar = this.getRandomAvatar();
            await this.db.collection('users').doc(uid).set({
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                maxLevelReached: 1,
                avatar: defaultAvatar,
                stats: {
                    totalGamesPlayed: 0,
                    totalKills: 0,
                    totalDeaths: 0,
                    highestWave: 0
                }
            });
            console.log('✅ New user document created');
        } catch (error) {
            console.error('❌ Error creating user document:', error);
        }
    }

    /**
     * Get random avatar for new users
     */
    getRandomAvatar() {
        const firstCharset = AVATAR_CONFIG.charsets[0];
        const totalAvatars = firstCharset.cols * firstCharset.rows;
        const randomIndex = Math.floor(Math.random() * totalAvatars);

        return {
            charsetId: firstCharset.id,
            index: randomIndex,
            row: Math.floor(randomIndex / firstCharset.cols),
            col: randomIndex % firstCharset.cols
        };
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            console.log('🔐 Attempting Google Sign-In...');

            // Check if native Android sign-in is available
            if (typeof Android !== 'undefined' && Android.signInWithGoogle) {
                console.log('🔵 Usando Android.signInWithGoogle()');
                Android.signInWithGoogle();
            } else {
                // Fallback to web-based Google sign-in
                console.log('🌐 Using web-based Google Sign-In (popup)');
                const provider = new firebase.auth.GoogleAuthProvider();

                try {
                    const result = await this.auth.signInWithPopup(provider);
                    console.log('🟢 [signInWithGoogle] Resultado:', result);
                    if (result && result.user) {
                        console.log('🟢 [signInWithGoogle] Usuario autenticado:', result.user.email || result.user.displayName, result.user.uid);
                    } else {
                        console.warn('🟠 [signInWithGoogle] No se obtuvo usuario tras login.');
                    }
                } catch (popupError) {
                    console.error('❌ signInWithPopup error:', popupError);

                    // Si el popup falla (bloqueado, dominio no autorizado, etc.)
                    if (popupError.code === 'auth/unauthorized-domain') {
                        alert('⚠️ Dominio no autorizado en Firebase Console.\n\n' +
                              'Para probar en navegador:\n' +
                              '1. Ve a Firebase Console → Authentication → Settings\n' +
                              '2. Agrega "localhost" y "127.0.0.1" a dominios autorizados\n' +
                              '3. Recarga la página\n\n' +
                              'O compila y prueba en la app Android nativa.');
                    } else if (popupError.code === 'auth/popup-blocked') {
                        alert('⚠️ El navegador bloqueó el popup de Google Sign-In.\n\n' +
                              'Permite popups para este sitio e intenta de nuevo.');
                    } else {
                        alert('Error al iniciar sesión con Google: ' + popupError.message);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Google Sign-In error:', error);
            alert('Error al iniciar sesión con Google. Intenta de nuevo.');
        }
    }

    /**
     * Sign in as guest
     */
    signInAsGuest() {
        this.isGuestMode = true;
        window.isGuestMode = true;
        this.maxLevelReached = 1;
        console.log('👤 Guest mode activated');

        // Navigate to level selector
        UIManager.showLevelSelector();
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await this.auth.signOut();
            this.isGuestMode = false;
            window.isGuestMode = false;
            console.log('👋 Signed out successfully');

            // Navigate to start menu
            UIManager.showStartMenu();
        } catch (error) {
            console.error('❌ Sign out error:', error);
        }
    }

    /**
     * Update UI for logged in user
     */
    updateUIForLoggedInUser(user) {
        // Hide login card
        const loginCard = document.querySelector('.login-card');
        if (loginCard) loginCard.style.display = 'none';

        // Show user menu
        const userMenu = document.querySelector('.user-menu-wrapper');
        if (userMenu) userMenu.style.display = 'flex';

        // Update user profile
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');

        if (userName) userName.textContent = user.displayName || 'Player';
        if (userEmail) userEmail.textContent = user.email || '';
        if (userAvatar && user.photoURL) userAvatar.src = user.photoURL;
    }

    /**
     * Update UI for logged out user
     */
    updateUIForLoggedOutUser() {
        // Show login card
        const loginCard = document.querySelector('.login-card');
        if (loginCard) loginCard.style.display = 'flex';

        // Hide user menu
        const userMenu = document.querySelector('.user-menu-wrapper');
        if (userMenu) userMenu.style.display = 'none';
    }

    /**
     * Save game stats to Firestore
     */
    async saveGameStats(stats) {
        if (this.isGuestMode || !this.currentUser) {
            console.log('⚠️ Guest mode - stats not saved');
            return;
        }

        try {
            const docRef = this.db.collection('users').doc(this.currentUser.uid);
            await docRef.update({
                'stats.totalGamesPlayed': firebase.firestore.FieldValue.increment(1),
                'stats.totalKills': firebase.firestore.FieldValue.increment(stats.kills || 0),
                'stats.totalDeaths': firebase.firestore.FieldValue.increment(1),
                'stats.highestWave': this.maxLevelReached
            });
            console.log('💾 Stats saved successfully');
        } catch (error) {
            console.error('❌ Error saving stats:', error);
        }
    }

    /**
     * Update max level reached
     */
    async updateMaxLevel(level) {
        if (level > this.maxLevelReached) {
            this.maxLevelReached = level;

            if (!this.isGuestMode && this.currentUser) {
                try {
                    await this.db.collection('users').doc(this.currentUser.uid).update({
                        maxLevelReached: level
                    });
                    console.log(`🎯 Max level updated to: ${level}`);
                } catch (error) {
                    console.error('❌ Error updating max level:', error);
                }
            }
        }
    }
}

// Create global instance
window.firebaseHandler = new FirebaseHandler();

console.log('✅ Firebase Handler loaded');
