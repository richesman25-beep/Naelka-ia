package app.naelka.assistant;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.ActivityCallback;
import java.util.ArrayList;
import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NaelkaBridge")
public class NaelkaBridgePlugin extends Plugin {
    private VoiceController voice;

    @Override
    public void load() {
        voice = new VoiceController(getContext());
    }

    @PluginMethod
    public void dictate(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "fr-FR");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        try {
            startActivityForResult(call, intent, "onDictation");
        } catch (ActivityNotFoundException | SecurityException exception) {
            call.reject("DICTATION_UNAVAILABLE");
        }
    }

    @ActivityCallback
    private void onDictation(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            call.reject("DICTATION_CANCELLED");
            return;
        }
        ArrayList<String> texts = data == null ? null :
            data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (result.getResultCode() != Activity.RESULT_OK || texts == null || texts.isEmpty()) {
            call.reject("DICTATION_EMPTY");
            return;
        }
        call.resolve(new JSObject().put("text", texts.get(0)));
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.trim().isEmpty() || text.length() > TextToSpeech.getMaxSpeechInputLength()) {
            call.reject("INVALID_SPEECH_TEXT");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (voice.speak(text)) call.resolve();
            else call.reject("FRENCH_VOICE_UNAVAILABLE");
        });
    }

    @PluginMethod
    public void stopSpeech(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            voice.stop();
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        voice.close();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            getActivity().startActivity(new Intent(Settings.ACTION_SETTINGS));
            call.resolve();
        } catch (ActivityNotFoundException | SecurityException exception) {
            call.reject("Android settings are unavailable", exception);
        }
    }
}
