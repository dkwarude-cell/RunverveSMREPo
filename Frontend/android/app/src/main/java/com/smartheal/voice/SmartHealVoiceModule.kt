package com.smartheal.voice

import android.Manifest
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognitionService
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

/**
 * SmartHealVoice - the phone's own speech-to-text (SpeechRecognizer) and text-to-speech (TextToSpeech)
 * for the Assistant chat. No third-party libraries.
 *
 * Speech-to-text: one "session" per mic tap; only the first final result/error of a session is sent to JS,
 *                 late or duplicate callbacks from Android are ignored. Uses Google's recognizer when installed
 *                 (Samsung's own one is less reliable) and retries once with the phone's defaults if it fails
 *                 before anything was heard.
 * Text-to-speech: tries the installed engines one by one (Google first) until one starts, so it also
 *                 works on phones whose default engine is broken or missing.
 * Dictation:      opens Google's voice-typing popup in a chosen language (used for Hindi / Marathi).
 *
 * JS events: SmartHealVoice_ready / _partial / _result / _error / _end / _level
 *            SmartHealTts_start / _done / _error / _stopped
 */
class SmartHealVoiceModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

  companion object {
    const val NAME = "SmartHealVoice"
    private const val GOOGLE_TTS = "com.google.android.tts"
    private const val ENGINE_TIMEOUT_MS = 6000L
    private const val DICTATE_REQUEST = 7341
  }

  override fun getName(): String = NAME

  private val main = Handler(Looper.getMainLooper())

  private fun emit(event: String, data: WritableMap) {
    try {
      ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event, data)
    } catch (e: Exception) {
      // JS not ready - nothing to do
    }
  }

  // ═════════════════════════ DICTATION POPUP (any language) ═════════════════════════
  private var dictatePromise: Promise? = null

  private val activityListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != DICTATE_REQUEST) return
      val p = dictatePromise ?: return
      dictatePromise = null
      if (resultCode == Activity.RESULT_OK) {
        p.resolve(data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull() ?: "")
      } else {
        p.resolve(null) // closed without speaking
      }
    }
  }

  init {
    ctx.addActivityEventListener(activityListener)
  }

  /** Opens Google's "Speak now" popup in [language] (e.g. hi-IN, mr-IN). Resolves with the text, or null if cancelled. */
  @ReactMethod
  fun dictate(language: String?, prompt: String?, promise: Promise) {
    val activity = ctx.currentActivity
    if (activity == null) {
      promise.reject("no_activity", "Please open the app and try again")
      return
    }
    dictatePromise?.resolve(null)
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      if (!language.isNullOrBlank()) {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
      }
      if (!prompt.isNullOrBlank()) putExtra(RecognizerIntent.EXTRA_PROMPT, prompt)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
    }
    try {
      dictatePromise = promise
      activity.startActivityForResult(intent, DICTATE_REQUEST)
    } catch (e: ActivityNotFoundException) {
      dictatePromise = null
      promise.reject("not_available", "Google voice typing is not available on this phone. Install or update the Google app.")
    } catch (e: Exception) {
      dictatePromise = null
      promise.reject("dictate_failed", e.message ?: "Could not open voice typing")
    }
  }

  // required by NativeEventEmitter on the JS side
  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Double) {}

  // ═════════════════════════ SPEECH-TO-TEXT ═════════════════════════
  private var recognizer: SpeechRecognizer? = null
  private var sttSession = 0
  private var sttFinished = true
  private var sttFallbackUsed = false // already retried with the phone's default recognizer
  private var sttHeard = false // speech detected in this session (then errors are real, no retry)
  private var sttReady = false // the recognizer said it is listening
  private var sttAttempt = 0 // which recognizer instance is current (callbacks from older ones are ignored)
  private var lastLevelAt = 0L

  @ReactMethod
  fun startListening(language: String?, promise: Promise) {
    if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("permission", "Microphone permission not granted")
      return
    }
    main.post {
      try {
        if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
          promise.reject("not_available", "Speech recognition is not available on this phone. Install or update the Google app.")
          return@post
        }
        val session = ++sttSession
        sttFinished = false
        sttFallbackUsed = false
        sttHeard = false
        beginRecognition(session, preferGoogle = true, language = language)
        promise.resolve(session)
      } catch (e: Exception) {
        sttFinished = true
        promise.reject("start_failed", e.message ?: "Could not start voice input")
      }
    }
  }

  /** Google's recognition service if installed (null = use the phone's default). */
  private fun googleRecognizer(): ComponentName? = try {
    val services = ctx.packageManager.queryIntentServices(Intent(RecognitionService.SERVICE_INTERFACE), 0)
    val google = services.firstOrNull { it.serviceInfo.packageName == "com.google.android.googlequicksearchbox" }
      ?: services.firstOrNull { it.serviceInfo.packageName.startsWith("com.google.") }
    google?.let { ComponentName(it.serviceInfo.packageName, it.serviceInfo.name) }
  } catch (e: Exception) {
    null
  }

  /** Creates a fresh recognizer and starts listening (main thread only). */
  private fun beginRecognition(session: Int, preferGoogle: Boolean, language: String?) {
    try { recognizer?.destroy() } catch (e: Exception) {}
    val attempt = ++sttAttempt
    val component = if (preferGoogle) googleRecognizer() else null
    val r = if (component != null) SpeechRecognizer.createSpeechRecognizer(ctx, component) else SpeechRecognizer.createSpeechRecognizer(ctx)
    r.setRecognitionListener(listenerFor(session, attempt))
    recognizer = r
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      if (!language.isNullOrBlank()) {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
      }
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
      putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, ctx.packageName)
      // wait a bit longer before deciding the user has finished talking (ignored by some engines)
      putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L)
      putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L)
    }
    sttReady = false
    r.startListening(intent)
    // some recognizers never answer: if it isn't listening after 4 s, fall back / report an error
    main.postDelayed({
      if (session == sttSession && attempt == sttAttempt && !sttFinished && !sttReady) {
        if (!sttFallbackUsed && preferGoogle) {
          sttFallbackUsed = true
          try {
            beginRecognition(session, preferGoogle = false, language = null)
          } catch (e: Exception) {
            failSession(session, SpeechRecognizer.ERROR_CLIENT)
          }
        } else {
          try { recognizer?.cancel() } catch (e: Exception) {}
          failSession(session, SpeechRecognizer.ERROR_CLIENT, "Voice input didn't start. Update the Google app and try again.")
        }
      }
    }, 4000)
  }

  private fun failSession(session: Int, code: Int, message: String? = null) {
    if (session != sttSession || sttFinished) return
    sttFinished = true
    emit("SmartHealVoice_error", Arguments.createMap().apply {
      putInt("session", session)
      putInt("code", code)
      putString("message", message ?: sttErrorText(code))
    })
  }

  /** Stop listening - Android still delivers the final result of what was said. */
  @ReactMethod
  fun stopListening(promise: Promise) {
    main.post {
      try { recognizer?.stopListening() } catch (e: Exception) {}
      promise.resolve(null)
    }
  }

  /** Cancel without a result. */
  @ReactMethod
  fun cancelListening(promise: Promise) {
    main.post {
      sttSession++
      sttFinished = true
      try { recognizer?.cancel() } catch (e: Exception) {}
      promise.resolve(null)
    }
  }

  private fun sttErrorText(code: Int): String = when (code) {
    SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network problem - check your internet"
    SpeechRecognizer.ERROR_AUDIO -> "Microphone problem"
    SpeechRecognizer.ERROR_SERVER -> "Speech service problem - try again"
    SpeechRecognizer.ERROR_CLIENT -> "Voice input was interrupted"
    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech heard"
    SpeechRecognizer.ERROR_NO_MATCH -> "Couldn't understand that"
    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Voice input is busy - try again"
    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission needed"
    12, 13 -> "This language isn't available for voice input - check Google voice typing languages"
    else -> "Voice input error ($code)"
  }

  private fun listenerFor(session: Int, attempt: Int) = object : RecognitionListener {
    private fun live() = session == sttSession && attempt == sttAttempt && !sttFinished
    private fun data(): WritableMap = Arguments.createMap().apply { putInt("session", session) }

    override fun onReadyForSpeech(params: Bundle?) {
      if (!live()) return
      sttReady = true
      emit("SmartHealVoice_ready", data())
    }

    override fun onBeginningOfSpeech() {
      if (live()) sttHeard = true
    }

    override fun onRmsChanged(rmsdB: Float) {
      if (!live()) return
      val now = System.currentTimeMillis()
      if (now - lastLevelAt < 90) return // ~11 updates per second is enough for the mic animation
      lastLevelAt = now
      emit("SmartHealVoice_level", data().apply { putDouble("level", rmsdB.toDouble()) })
    }

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
      if (live()) emit("SmartHealVoice_end", data())
    }

    override fun onError(error: Int) {
      if (!live()) return // late errors after a result are normal on Android - ignore
      // failed before hearing anything (wrong engine / language not supported): retry once with the phone's defaults
      val retryable = error == SpeechRecognizer.ERROR_CLIENT || error == 11 || error == 12 || error == 13 ||
        error == SpeechRecognizer.ERROR_SERVER || error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
      if (retryable && !sttFallbackUsed && !sttHeard) {
        sttFallbackUsed = true
        main.postDelayed({
          if (session == sttSession && !sttFinished) {
            try {
              beginRecognition(session, preferGoogle = false, language = null)
            } catch (e: Exception) {
              failSession(session, error)
            }
          }
        }, 250)
        return
      }
      sttFinished = true
      emit("SmartHealVoice_error", data().apply {
        putInt("code", error)
        putString("message", sttErrorText(error))
      })
    }

    override fun onResults(results: Bundle?) {
      if (!live()) return // some phones send results twice - only the first counts
      sttFinished = true
      val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""
      emit("SmartHealVoice_result", data().apply { putString("text", text) })
    }

    override fun onPartialResults(partialResults: Bundle?) {
      if (!live()) return
      val text = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: return
      if (text.isNotBlank()) sttHeard = true
      if (text.isNotBlank()) emit("SmartHealVoice_partial", data().apply { putString("text", text) })
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}
  }

  // ═════════════════════════ TEXT-TO-SPEECH ═════════════════════════
  private var tts: TextToSpeech? = null
  private var ttsReady = false
  private var ttsIniting = false
  private var ttsEngine: String? = null
  private var ttsAttempt = 0
  private val ttsWaiting = mutableListOf<Pair<() -> Unit, Promise>>()

  /** Installed TTS engines: Google first, then the phone's default, then the rest, then "system default". */
  private fun ttsCandidates(): MutableList<String?> {
    val installed = try {
      ctx.packageManager
        .queryIntentServices(Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE), 0)
        .map { it.serviceInfo.packageName }
        .distinct()
    } catch (e: Exception) {
      emptyList()
    }
    val systemDefault = try { Settings.Secure.getString(ctx.contentResolver, "tts_default_synth") } catch (e: Exception) { null }
    val ordered = mutableListOf<String?>()
    if (installed.contains(GOOGLE_TTS)) ordered.add(GOOGLE_TTS)
    if (systemDefault != null && installed.contains(systemDefault) && !ordered.contains(systemDefault)) ordered.add(systemDefault)
    installed.forEach { if (!ordered.contains(it)) ordered.add(it) }
    ordered.add(null) // last resort: let Android pick
    return ordered
  }

  private fun runSafely(promise: Promise, action: () -> Unit) {
    try {
      action()
    } catch (e: Exception) {
      promise.reject("tts_error", e.message ?: "Text-to-speech error")
    }
  }

  /** Runs [action] once a TTS engine is ready (starts one if needed). */
  private fun withTts(promise: Promise, action: () -> Unit) {
    main.post {
      if (ttsReady && tts != null) {
        runSafely(promise, action)
        return@post
      }
      ttsWaiting.add(Pair(action, promise))
      if (!ttsIniting) {
        ttsIniting = true
        tryEngines(ttsCandidates())
      }
    }
  }

  private fun failWaiting() {
    ttsIniting = false
    val waiting = ttsWaiting.toList()
    ttsWaiting.clear()
    waiting.forEach {
      it.second.reject(
        "tts_unavailable",
        "No working text-to-speech engine found. Install or update \"Speech Services by Google\" from the Play Store, " +
          "then choose it in Settings > Text-to-speech output.",
      )
    }
  }

  private fun tryEngines(queue: MutableList<String?>) {
    if (queue.isEmpty()) {
      failWaiting()
      return
    }
    val engine = queue.removeAt(0)
    val attempt = ++ttsAttempt
    var instance: TextToSpeech? = null

    val onInit = TextToSpeech.OnInitListener { status ->
      main.post {
        if (attempt != ttsAttempt) return@post // timed out already
        val t = instance
        if (status == TextToSpeech.SUCCESS && t != null) {
          setupTts(t)
          tts = t
          ttsEngine = engine
          ttsReady = true
          ttsIniting = false
          val waiting = ttsWaiting.toList()
          ttsWaiting.clear()
          waiting.forEach { (action, p) -> runSafely(p, action) }
        } else {
          try { t?.shutdown() } catch (e: Exception) {}
          tryEngines(queue)
        }
      }
    }

    instance = try {
      if (engine == null) TextToSpeech(ctx, onInit) else TextToSpeech(ctx, onInit, engine)
    } catch (e: Exception) {
      null
    }
    if (instance == null) {
      tryEngines(queue)
      return
    }
    // some broken engines never answer - move on after a few seconds
    main.postDelayed({
      if (attempt == ttsAttempt && !ttsReady) {
        ttsAttempt++
        try { instance?.shutdown() } catch (e: Exception) {}
        tryEngines(queue)
      }
    }, ENGINE_TIMEOUT_MS)
  }

  private fun idData(id: String?): WritableMap = Arguments.createMap().apply { putString("id", id ?: "") }

  private fun setupTts(t: TextToSpeech) {
    val indian = try { t.setLanguage(Locale.forLanguageTag("en-IN")) } catch (e: Exception) { TextToSpeech.LANG_NOT_SUPPORTED }
    if (indian < TextToSpeech.LANG_AVAILABLE) {
      try { t.setLanguage(Locale.US) } catch (e: Exception) {}
    }
    try { t.setSpeechRate(1.0f) } catch (e: Exception) {}
    try {
      t.setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build(),
      )
    } catch (e: Exception) {}
    t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String?) = emit("SmartHealTts_start", idData(utteranceId))
      override fun onDone(utteranceId: String?) = emit("SmartHealTts_done", idData(utteranceId))
      @Deprecated("Deprecated in Java")
      override fun onError(utteranceId: String?) = emit("SmartHealTts_error", idData(utteranceId))
      override fun onError(utteranceId: String?, errorCode: Int) = emit("SmartHealTts_error", idData(utteranceId))
      override fun onStop(utteranceId: String?, interrupted: Boolean) = emit("SmartHealTts_stopped", idData(utteranceId))
    })
  }

  /** Queues [text] to be spoken. Resolves with the engine name once queued. */
  @ReactMethod
  fun speak(text: String, utteranceId: String, promise: Promise) {
    withTts(promise) {
      val t = tts ?: throw IllegalStateException("Text-to-speech is not ready")
      val max = TextToSpeech.getMaxSpeechInputLength()
      val safe = if (text.length > max) text.substring(0, max) else text
      val params = Bundle().apply { putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f) }
      val result = t.speak(safe, TextToSpeech.QUEUE_ADD, params, utteranceId)
      if (result == TextToSpeech.SUCCESS) promise.resolve(ttsEngine ?: "default")
      else promise.reject("tts_error", "The speech engine could not play this text")
    }
  }

  @ReactMethod
  fun stopSpeaking(promise: Promise) {
    main.post {
      try { tts?.stop() } catch (e: Exception) {}
      promise.resolve(null)
    }
  }

  /** Opens Android's "Text-to-speech output" settings. */
  @ReactMethod
  fun openTtsSettings() {
    try {
      ctx.startActivity(Intent("com.android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (e: Exception) {
      try {
        ctx.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (e2: Exception) {}
    }
  }

  override fun invalidate() {
    try { ctx.removeActivityEventListener(activityListener) } catch (e: Exception) {}
    main.post {
      try { recognizer?.destroy() } catch (e: Exception) {}
      recognizer = null
      try {
        tts?.stop()
        tts?.shutdown()
      } catch (e: Exception) {}
      tts = null
      ttsReady = false
      ttsIniting = false
    }
    super.invalidate()
  }
}