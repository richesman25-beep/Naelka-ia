package app.naelka.assistant;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import java.util.Locale;

final class VoiceController {
    private TextToSpeech engine;
    private boolean ready;

    VoiceController(Context context) {
        Handler mainThread = new Handler(Looper.getMainLooper());
        engine = new TextToSpeech(context, status -> mainThread.post(() -> {
            if (status == TextToSpeech.SUCCESS && engine != null) {
                ready = engine.setLanguage(Locale.FRANCE) >= TextToSpeech.LANG_AVAILABLE;
            }
        }));
    }

    boolean speak(String text) {
        return ready && engine != null &&
            engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "naelka-reply") == TextToSpeech.SUCCESS;
    }

    void stop() {
        if (engine != null) engine.stop();
    }

    void close() {
        if (engine != null) {
            engine.shutdown();
            engine = null;
        }
        ready = false;
    }
}
