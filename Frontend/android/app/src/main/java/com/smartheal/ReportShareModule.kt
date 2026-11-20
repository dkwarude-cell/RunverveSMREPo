package com.smartheal

import android.content.Intent
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import java.io.File

/**
 * Shares an AI Scan report PDF (built by the backend) through the Android share sheet - WhatsApp, Gmail, Drive...
 * The file is written to cache/reports/ and handed to other apps via the FileProvider in AndroidManifest.xml.
 */
class ReportShareModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "ReportShare"

  @ReactMethod
  fun sharePdf(base64: String, fileName: String, promise: Promise) {
    try {
      val dir = File(ctx.cacheDir, "reports").apply { mkdirs() }
      dir.listFiles()?.forEach { it.delete() } // only keep the latest export
      val safeName = fileName.replace(Regex("[^A-Za-z0-9._-]"), "_")
      val file = File(dir, safeName)
      file.writeBytes(Base64.decode(base64, Base64.DEFAULT))

      val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.fileprovider", file)
      val send = Intent(Intent.ACTION_SEND).apply {
        type = "application/pdf"
        putExtra(Intent.EXTRA_STREAM, uri)
        putExtra(Intent.EXTRA_SUBJECT, "SmartHeal AI Scan Report")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val chooser = Intent.createChooser(send, "Share report with your doctor").apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      (ctx.currentActivity ?: ctx).startActivity(chooser)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("share_failed", e.message ?: "Could not share the report", e)
    }
  }
}

/** Registers ReportShareModule with React Native (added in MainApplication.kt). */
class ReportSharePackage : ReactPackage {

  @Deprecated("Classic package API - still supported for app modules")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(ReportShareModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<in Nothing, in Nothing>> =
    emptyList()
}
