# NEON SURVIVOR - Official Keystore Documentation

## Keystore Location
- **Path:** `android/key_store/keystore`
- **Alias:** `neon-survivor`
- **Store Password:** `NeonSurvivor2025!`
- **Key Password:** `NeonSurvivor2025!`
- **Algorithm:** RSA 2048 bits, SHA256withRSA
- **Validity:** 10,000 days (~27.4 years)

## Fingerprints
- **SHA1:** F0:2D:95:F9:34:15:CC:BA:C6:94:D2:8B:D0:24:D0:66:3E:2C:01:61
- **SHA256:** 28:CC:55:CF:3D:DF:B7:02:3C:56:2B:09:C5:8F:89:D5:B9:AF:C7:9F:6A:E6:91:C2:13:B3:66:23:9C:C2:28:EF

## Usage Rules
1. **ALWAYS use this keystore for all APK builds.**
2. **NEVER create new keystores without explicit user permission.**
3. **ALWAYS backup this keystore before major changes.**
4. **Firebase Console must have the SHA1 fingerprint registered.**
5. **Verify fingerprint with:**
   ```powershell
   keytool -list -v -keystore android/key_store/keystore -storepass NeonSurvivor2025!
   ```

## Firebase Console Configuration
- Add the SHA1 fingerprint above to your Firebase Android app settings.
- Download the new `google-services.json` after updating.
- Replace `android/app/google-services.json` with the new file.
- Rebuild the APK.

## Backup Instructions
- Store a copy of `android/key_store/keystore` in a secure location.
- Document any changes to the keystore in this file.

---
**This file is the single source of truth for keystore management.**
