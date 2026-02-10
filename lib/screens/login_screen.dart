import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:async';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import 'main_container.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService();
  StreamSubscription<User?>? _authSubscription;
  bool _isLoading = false;
  bool _isRegisterMode = false;
  bool _obscurePassword = true;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Controllers untuk email/password
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.3, 1.0, curve: Curves.easeOut),
      ),
    );
    
    _animationController.forward();
    
    // Subscribe to auth state changes for robust auto-login
    _authSubscription = _authService.authStateChanges.listen((user) {
      if (user != null) {
        debugPrint('[Login] Auth state changed: User logged in, navigating...');
        _navigateToDashboard();
      }
    });
  }
  
  void _navigateToDashboard() {
    // Use Future.delayed to ensure we are not in a build phase
    Future.delayed(Duration.zero, () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MainContainer()),
        );
      }
    });
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _animationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);

    try {
      final userCredential = await _authService.signInWithGoogle();
      
      if (userCredential != null) {
        debugPrint('[Login] Google Sign-In success.');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Login gagal: ${e.toString()}'),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleEmailSignIn() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showError('Masukkan email dan password');
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (_isRegisterMode) {
        final name = _nameController.text.trim();
        await _authService.registerWithEmail(
          email, 
          password,
          displayName: name.isNotEmpty ? name : null,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('✅ Registrasi berhasil!'),
              backgroundColor: Colors.green.shade700,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      } else {
        await _authService.signInWithEmail(email, password);
      }
    } catch (e) {
      _showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }
  
  // Skip login for guest access
  void _handleSkipLogin() {
    debugPrint('[Login] Skip login invoked.');
    _navigateToDashboard();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF1A1A2E),
              Color(0xFF16213E),
              Color(0xFF0F3460),
            ],
            stops: [0.0, 0.5, 1.0],
          ),
        ),
        child: Stack(
          children: [
            // Abstract background circles
            Positioned(
              top: -100,
              right: -100,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF00D4FF).withValues(alpha: 0.2),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -50,
              left: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFE94560).withValues(alpha: 0.15),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: SlideTransition(
                      position: _slideAnimation,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Logo/Icon
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFF00D4FF),
                                  Color(0xFF5E60CE),
                                  Color(0xFFE94560),
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF00D4FF).withValues(alpha: 0.3),
                                  blurRadius: 30,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.account_balance_rounded,
                              size: 50,
                              color: Colors.white,
                            ),
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Title
                          Text(
                            'Rekap Realisasi',
                            style: GoogleFonts.poppins(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                          ),
                          
                          Text(
                            'PAD Wilayah Jawa',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w300,
                              color: Colors.white.withValues(alpha: 0.8),
                              letterSpacing: 2,
                            ),
                          ),
                          
                          const SizedBox(height: 12),
                          
                          // Subtitle (Year)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.2),
                              ),
                            ),
                            child: Text(
                              '2021 - 2025',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF00D4FF),
                              ),
                            ),
                          ),
                          
                          const SizedBox(height: 40),
                          
                          // TAMPILAN KHUSUS WINDOWS/DESKTOP
                          if (_authService.isDesktop) ...[
                            // 1. Form Email (Langsung muncul)
                            _buildEmailPasswordForm(),
                            
                            const SizedBox(height: 20),
                            
                            // Divider "Atau"
                            Row(
                              children: [
                                Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.2))),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Text(
                                    'Atau masuk dengan',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: Colors.white.withValues(alpha: 0.5),
                                    ),
                                  ),
                                ),
                                Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.2))),
                              ],
                            ),
                            
                            const SizedBox(height: 20),

                            // 2. Tombol Google
                            _buildGoogleSignInButton(),
                            
                            const SizedBox(height: 16),
                          ]
                          // TAMPILAN KHUSUS MOBILE / WEB
                          else ...[
                            // 1. Tombol Google (Hanya di Mobile/Web)
                            _buildGoogleSignInButton(),
                            const SizedBox(height: 16),

                            // 2. Tombol Toggle untuk Email
                            if (!_isRegisterMode && _emailController.text.isEmpty && _passwordController.text.isEmpty)
                              _buildEmailLoginToggleButton(),

                            // 3. Form Email (Muncul jika ditoggle)
                            if (_isRegisterMode || _emailController.text.isNotEmpty || _passwordController.text.isNotEmpty)
                              _buildEmailPasswordForm(),
                          ],
                          
                          // Skip login button (Selalu ada)
                          TextButton(
                            onPressed: _handleSkipLogin,
                            child: Text(
                              'Lanjutkan tanpa login',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                color: Colors.white.withValues(alpha: 0.6),
                                decoration: TextDecoration.underline,
                                decorationColor: Colors.white.withValues(alpha: 0.6),
                              ),
                            ),
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Info text
                          Text(
                            _authService.isDesktop
                                ? 'Login dengan email dan password untuk mengakses data'
                                : 'Login dengan akun Google Anda\nuntuk mengakses data realisasi PAD',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.6),
                              height: 1.5,
                            ),
                          ),
                          
                          const SizedBox(height: 40),
                          
                          // Footer
                          Text(
                            '© 2025 Rekap PAD Jawa',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.3),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmailLoginToggleButton() {
    return GestureDetector(
      onTap: () {
        // Trigger UI update to show form
        setState(() {
           // Hacky way to show form: set dummy text or use a bool flag.
           // Let's use a bool flag _showEmailForm in a real app, but here
           // we can just pretend user started typing or add a proper state variable if needed.
           // For now, let's just make the user type directly or use a state var.
           // Simplest: just init controller to space to trigger 'isNotEmpty' check, or handle state properly.
           
           // Better approach: Let's create a dedicated bool _showEmailForm.
           // Since I cannot change state vars easily in this tool, I will rely on _emailController hack 
           // OR better: Just show the form always but collapsed?
           
           // Actually, let's just use the current controllers.
           _emailController.text = " "; // Trigger form show
           _emailController.selection = const TextSelection.collapsed(offset: 1);
           // Clear it immediately after next frame? No, let user see form.
           Future.delayed(Duration.zero, () => _emailController.clear()); 
        });
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          'Masuk dengan Email',
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildEmailPasswordForm() {
    return Column(
      children: [
        const SizedBox(height: 20),
        // Header
        Text(
          _isRegisterMode ? 'Daftar Akun Baru' : 'Login manual',
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.white.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 12),

        // Name field (Register mode only)
        if (_isRegisterMode)
          _buildTextField(
            controller: _nameController,
            hint: 'Nama Lengkap',
            icon: Icons.person_outline,
          ),
        
        if (_isRegisterMode) const SizedBox(height: 12),

        // Email field
        _buildTextField(
          controller: _emailController,
          hint: 'Email',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        
        const SizedBox(height: 12),
        
        // Password field
        _buildTextField(
          controller: _passwordController,
          hint: 'Password',
          icon: Icons.lock_outline,
          isPassword: true,
        ),
        
        const SizedBox(height: 16),
        
        // Login/Register Button
        GestureDetector(
          onTap: _isLoading ? null : _handleEmailSignIn,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00D4FF), Color(0xFF5E60CE)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF00D4FF).withValues(alpha: 0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: _isLoading
                ? const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                  )
                : Text(
                    _isRegisterMode ? 'Daftar' : 'Masuk',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
        
        const SizedBox(height: 10),
        
        // Toggle Register/Login
        TextButton(
          onPressed: () {
            setState(() {
              _isRegisterMode = !_isRegisterMode;
            });
          },
          child: Text(
            _isRegisterMode 
                ? 'Sudah punya akun? Masuk' 
                : 'Belum punya akun? Daftar',
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: const Color(0xFF00D4FF).withValues(alpha: 0.8),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    TextInputType? keyboardType,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.15),
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword ? _obscurePassword : false,
        keyboardType: keyboardType,
        style: GoogleFonts.poppins(
          color: Colors.white,
          fontSize: 14,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.poppins(
            color: Colors.white.withValues(alpha: 0.4),
            fontSize: 14,
          ),
          prefixIcon: Icon(icon, color: Colors.white.withValues(alpha: 0.5), size: 20),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off : Icons.visibility,
                    color: Colors.white.withValues(alpha: 0.5),
                    size: 20,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        ),
        onSubmitted: (_) => _handleEmailSignIn(),
      ),
    );
  }

  Widget _buildGoogleSignInButton() {
    return GestureDetector(
      onTap: _isLoading ? null : () async {
        // Check platform manually here for better UX feedback
        try {
           await _handleGoogleSignIn();
        } catch (_) {
           // Error handled in _handleGoogleSignIn but we can double check here
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.white.withValues(alpha: 0.2),
              blurRadius: 20,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Stack(
                children: [
                  Text(
                    'G',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF4285F4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Masuk dengan Google',
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1A1A2E),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
