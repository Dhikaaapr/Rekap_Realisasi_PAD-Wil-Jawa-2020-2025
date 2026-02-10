import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';

/// Auth Service untuk mengelola autentikasi
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  // GoogleSignIn hanya untuk Android/iOS
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
    ],
  );

  /// Stream untuk listen perubahan auth state
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Get current user
  User? get currentUser => _auth.currentUser;

  /// Check if user is logged in
  bool get isLoggedIn => _auth.currentUser != null;

  /// Check apakah platform adalah desktop (Windows/Linux/macOS)
  bool get isDesktop =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.windows ||
       defaultTargetPlatform == TargetPlatform.linux ||
       defaultTargetPlatform == TargetPlatform.macOS);

  /// Check apakah Google Sign-In tersedia di platform ini
  bool get isGoogleSignInAvailable => !isDesktop;

  /// Sign in dengan Google (hanya untuk Android/iOS/Web)
  Future<UserCredential?> signInWithGoogle() async {
    try {
      debugPrint('[AuthService] Starting Google Sign-In...');
      debugPrint('[AuthService] Platform: $defaultTargetPlatform, isWeb: $kIsWeb');

      if (isDesktop) {
        throw Exception(
          'Google Sign-In belum tersedia di Desktop (Windows).\n'
          'Silakan gunakan "Masuk dengan Email" atau "Lanjutkan tanpa login".'
        );
      }

      // Untuk Web, pakai signInWithPopup
      if (kIsWeb) {
        final GoogleAuthProvider googleProvider = GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');
        final UserCredential userCredential = 
            await _auth.signInWithPopup(googleProvider);
        debugPrint('[AuthService] ✅ Web Sign-In success: ${userCredential.user?.email}');
        return userCredential;
      }

      // Untuk Android/iOS, pakai google_sign_in package (native)
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        debugPrint('[AuthService] ❌ User cancelled sign in');
        return null;
      }

      debugPrint('[AuthService] Google user: ${googleUser.email}');

      final GoogleSignInAuthentication googleAuth = 
          await googleUser.authentication;

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      debugPrint('[AuthService] ✅ Signed in: ${userCredential.user?.email}');
      return userCredential;

    } catch (e) {
      debugPrint('[AuthService] ❌ Google Sign-In error: $e');
      rethrow;
    }
  }

  /// Sign in dengan Email & Password
  Future<UserCredential?> signInWithEmail(String email, String password) async {
    try {
      debugPrint('[AuthService] Starting Email Sign-In...');
      
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      debugPrint('[AuthService] ✅ Email Sign-In success: ${userCredential.user?.email}');
      return userCredential;
    } on FirebaseAuthException catch (e) {
      debugPrint('[AuthService] ❌ Email Sign-In error: ${e.code} - ${e.message}');
      
      String message;
      switch (e.code) {
        case 'user-not-found':
          message = 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.';
          break;
        case 'wrong-password':
        case 'invalid-credential':
          message = 'Email atau password salah.';
          break;
        case 'invalid-email':
          message = 'Format email tidak valid.';
          break;
        case 'user-disabled':
          message = 'Akun ini telah dinonaktifkan.';
          break;
        case 'too-many-requests':
          message = 'Terlalu banyak percobaan. Coba lagi nanti.';
          break;
        default:
          message = 'Login gagal: ${e.message}';
      }
      throw Exception(message);
    } catch (e) {
      debugPrint('[AuthService] ❌ Email Sign-In error: $e');
      rethrow;
    }
  }

  /// Register dengan Email & Password
  Future<UserCredential?> registerWithEmail(String email, String password, {String? displayName}) async {
    try {
      debugPrint('[AuthService] Starting Email Registration...');
      
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update display name jika ada
      if (displayName != null && userCredential.user != null) {
        await userCredential.user!.updateDisplayName(displayName);
      }
      
      debugPrint('[AuthService] ✅ Registration success: ${userCredential.user?.email}');
      return userCredential;
    } on FirebaseAuthException catch (e) {
      debugPrint('[AuthService] ❌ Registration error: ${e.code} - ${e.message}');
      
      String message;
      switch (e.code) {
        case 'weak-password':
          message = 'Password terlalu lemah (minimal 6 karakter).';
          break;
        case 'email-already-in-use':
          message = 'Email sudah terdaftar. Silakan login.';
          break;
        case 'invalid-email':
          message = 'Format email tidak valid.';
          break;
        default:
          message = 'Registrasi gagal: ${e.message}';
      }
      throw Exception(message);
    } catch (e) {
      debugPrint('[AuthService] ❌ Registration error: $e');
      rethrow;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      debugPrint('[AuthService] Signing out...');

      // Sign out from Google (only on mobile)
      if (!kIsWeb && !isDesktop) {
        try {
          await _googleSignIn.signOut();
        } catch (e) {
          debugPrint('[AuthService] Google sign out skipped: $e');
        }
      }
      
      // Sign out from Firebase
      await _auth.signOut();

      debugPrint('[AuthService] ✅ Signed out successfully');
    } catch (e) {
      debugPrint('[AuthService] ❌ Sign out error: $e');
      rethrow;
    }
  }

  /// Get user display name
  String? get displayName => _auth.currentUser?.displayName;

  /// Get user email
  String? get email => _auth.currentUser?.email;

  /// Get user photo URL
  String? get photoURL => _auth.currentUser?.photoURL;
}
