package com.smartheal.voice

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Registers SmartHealVoiceModule with React Native (added in MainApplication.kt). */
class SmartHealVoicePackage : ReactPackage {

  @Deprecated("Classic package API - still supported for app modules")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(SmartHealVoiceModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<in Nothing, in Nothing>> =
    emptyList()
}