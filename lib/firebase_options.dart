// File generated manually based on Firebase Console config.
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.iOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for iOS - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macOS - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for Linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  // Android config from google-services.json
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDLZijebabnW2jqIDLc6tqdBkenG_UIZT4',
    appId: '1:1043512873996:android:844d9c85520f67330f8a29',
    messagingSenderId: '1043512873996',
    projectId: 'rekap-pad',
    storageBucket: 'rekap-pad.firebasestorage.app',
  );

  // Web config from Firebase Console
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyB8gx6JzexoivdbxCrv0AhpTCEhGqIuumA',
    appId: '1:1043512873996:web:b4469b951c7314d40f8a29',
    messagingSenderId: '1043512873996',
    projectId: 'rekap-pad',
    authDomain: 'rekap-pad.firebaseapp.com',
    storageBucket: 'rekap-pad.firebasestorage.app',
    measurementId: 'G-SHRDV9S4S3',
  );

  // Windows uses the same config as Web
  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyB8gx6JzexoivdbxCrv0AhpTCEhGqIuumA',
    appId: '1:1043512873996:web:b4469b951c7314d40f8a29',
    messagingSenderId: '1043512873996',
    projectId: 'rekap-pad',
    authDomain: 'rekap-pad.firebaseapp.com',
    storageBucket: 'rekap-pad.firebasestorage.app',
    measurementId: 'G-SHRDV9S4S3',
  );
}
