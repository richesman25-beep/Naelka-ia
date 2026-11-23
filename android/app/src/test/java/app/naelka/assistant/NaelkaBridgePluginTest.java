package app.naelka.assistant;

import static org.junit.Assert.assertEquals;

import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.junit.Test;

public class NaelkaBridgePluginTest {
    @Test
    public void exportsSettingsUnderTheFrontendPluginName() throws NoSuchMethodException {
        assertEquals("NaelkaBridge", NaelkaBridgePlugin.class.getAnnotation(CapacitorPlugin.class).name());
        assertEquals(
            PluginMethod.RETURN_PROMISE,
            NaelkaBridgePlugin.class.getMethod("openSettings", PluginCall.class)
                .getAnnotation(PluginMethod.class).returnType()
        );
    }
}
