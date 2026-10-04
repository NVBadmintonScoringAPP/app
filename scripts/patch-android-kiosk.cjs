/* Patches the generated Capacitor Android project to run in kiosk mode:
 * - immersive fullscreen (hidden status/navigation bars)
 * - screen always on
 * - screen pinning (startLockTask) so the user cannot switch apps
 * Run after `npx cap add android`.
 */
const fs = require('fs');
const path = require('path');

const pkgDir = path.join('android', 'app', 'src', 'main', 'java', 'bg', 'nvbadminton', 'scoring');
const file = path.join(pkgDir, 'MainActivity.java');

const java = `package bg.nvbadminton.scoring;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    hideSystemUi();
  }

  @Override
  public void onResume() {
    super.onResume();
    hideSystemUi();
    try {
      startLockTask();
    } catch (Exception ignored) {
    }
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) hideSystemUi();
  }

  private void hideSystemUi() {
    getWindow().getDecorView().setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
  }
}
`;

fs.mkdirSync(pkgDir, { recursive: true });
fs.writeFileSync(file, java);
console.log('Patched', file);
