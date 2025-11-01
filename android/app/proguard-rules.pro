# Add project specific ProGuard rules here.
# Keep all classes in the app package
-keep class com.luise7e.neonsurvivor.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
