package com.smartheal

import android.os.Process
import android.os.SystemClock
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

/**
 * The app launches with SplashTheme (red window background) so there is no white flash while JS loads.
 * Once the JS SplashScreen is done it calls restore() to put the normal white background back
 * (otherwise red would peek through e.g. while the keyboard opens).
 */
class SplashBackgroundModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "SplashBackground"

  // when the app process started (epoch ms), so the JS splash can keep the total launch time under 3 s
  override fun getConstants(): Map<String, Any> =
    mapOf("startedAt" to System.currentTimeMillis() - (SystemClock.elapsedRealtime() - Process.getStartElapsedRealtime()))

  @ReactMethod
  fun restore() {
    val activity = ctx.currentActivity ?: return
    activity.runOnUiThread { activity.window.setBackgroundDrawableResource(R.color.app_background) }
  }
}

/** Registers SplashBackgroundModule with React Native (added in MainApplication.kt). */
class SplashBackgroundPackage : ReactPackage {

  @Deprecated("Classic package API - still supported for app modules")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(SplashBackgroundModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<in Nothing, in Nothing>> =
    emptyList()
}
