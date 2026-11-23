package app.naelka.assistant;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NaelkaBridge")
public class NaelkaBridgePlugin extends Plugin {
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
