import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'presentation/home/main_layout.dart';
import 'presentation/auth/login_screen.dart';

void main() {
  runApp(const WebinarHubApp());
}

class WebinarHubApp extends StatelessWidget {
  const WebinarHubApp({super.key});

  Future<bool> _isLoggedIn() async {
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'accessToken');
    return token != null;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Webinar Hub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6200EA), // Premium Deep Purple
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        navigationBarTheme: NavigationBarThemeData(
          indicatorColor: const Color(0xFF6200EA).withOpacity(0.2),
        ),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          scrolledUnderElevation: 1,
        )
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFBB86FC),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      home: FutureBuilder<bool>(
        future: _isLoggedIn(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          if (snapshot.data == true) {
            return const MainLayout();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
