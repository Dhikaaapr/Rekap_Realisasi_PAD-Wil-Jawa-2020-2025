import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';

/// Auth Service untuk mengelola autentikasi dengan Google Sign-In
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
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

  /// Sign in dengan Google
  Future<UserCredential?> signInWithGoogle() async {
    try {
      debugPrint('[AuthService] Starting Google Sign-In...');

      // Trigger sign in flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        debugPrint('[AuthService] ❌ User cancelled sign in');
        return null;
      }

      debugPrint('[AuthService] Google user: ${googleUser.email}');

      // Get auth details from request
      final GoogleSignInAuthentication googleAuth = 
          await googleUser.authentication;

      // Create credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase with credential
      final userCredential = await _auth.signInWithCredential(credential);

      debugPrint('[AuthService] ✅ Signed in: ${userCredential.user?.email}');
      return userCredential;

    } catch (e) {
      debugPrint('[AuthService] ❌ Google Sign-In error: $e');
      rethrow;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      debugPrint('[AuthService] Signing out...');

      // Sign out from Google
      await _googleSignIn.signOut();
      
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
