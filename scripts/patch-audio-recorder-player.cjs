const fs = require('node:fs');
const path = require('node:path');

const targetPath = path.resolve(
  process.cwd(),
  'node_modules/react-native-audio-recorder-player/android/src/main/java/com/dooboolab.audiorecorderplayer/RNAudioRecorderPlayerModule.kt',
);

if (!fs.existsSync(targetPath)) {
  console.log('[patch-audio-recorder-player] Target not found. Skipping.');
  process.exit(0);
}

const source = fs.readFileSync(targetPath, 'utf8');

const replacements = [
  {
    from: `if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // On devices that run Android 10 (API level 29) or higher`,
    to: `if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val currentActivity = reactContext.currentActivity
                // On devices that run Android 10 (API level 29) or higher`,
  },
  {
    from: `                    ActivityCompat.requestPermissions((currentActivity)!!, arrayOf(
                            Manifest.permission.RECORD_AUDIO,
                            Manifest.permission.WRITE_EXTERNAL_STORAGE), 0)`,
    to: `                    if (currentActivity == null) {
                        promise.reject("No permission granted.", "Try again after adding permission.")
                        return
                    }

                    ActivityCompat.requestPermissions(currentActivity, arrayOf(
                            Manifest.permission.RECORD_AUDIO,
                            Manifest.permission.WRITE_EXTERNAL_STORAGE), 0)`,
  },
  {
    from: `                    ActivityCompat.requestPermissions((currentActivity)!!, arrayOf(Manifest.permission.RECORD_AUDIO), 0)`,
    to: `                    if (currentActivity == null) {
                        promise.reject("No permission granted.", "Try again after adding permission.")
                        return
                    }

                    ActivityCompat.requestPermissions(currentActivity, arrayOf(Manifest.permission.RECORD_AUDIO), 0)`,
  },
  {
    from: `                    mediaPlayer!!.setDataSource(currentActivity!!.applicationContext, Uri.parse(path), headers)`,
    to: `                    mediaPlayer!!.setDataSource(reactContext.applicationContext, Uri.parse(path), headers)`,
  },
];

let patched = source;

for (const replacement of replacements) {
  patched = patched.replace(replacement.from, replacement.to);
}

if (patched === source) {
  console.log('[patch-audio-recorder-player] No changes needed.');
  process.exit(0);
}

fs.writeFileSync(targetPath, patched);
console.log('[patch-audio-recorder-player] Patched Android module for RN 0.84 compatibility.');
