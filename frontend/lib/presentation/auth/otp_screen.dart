import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/network/api_client.dart';
import 'login_screen.dart';

class OtpScreen extends StatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpController = TextEditingController();
  final ApiClient _api = ApiClient();
  bool _isLoading = false;

  Future<void> _verifyOtp() async {
    setState(() => _isLoading = true);
    try {
      await _api.dio.post('/auth/verify-otp', data: {
        'phone': widget.phone,
        'otp': _otpController.text.trim(),
      });
      if(mounted){
          ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Verification Successful! Please login.'))
          );
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (route) => false,
          );
      }
    } on DioException catch (e) {
      if(mounted){
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(e.response?.data['error'] ?? 'OTP Failed'), backgroundColor: Colors.red)
          );
      }
    } finally {
      if(mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify Phone')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Enter the OTP sent to ${widget.phone}', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            TextField(
              controller: _otpController,
              decoration: const InputDecoration(labelText: '6-Digit OTP', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
              maxLength: 6,
            ),
            const SizedBox(height: 24),
            _isLoading 
              ? const CircularProgressIndicator()
              : ElevatedButton(
                  onPressed: _verifyOtp,
                  style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                  child: const Text('VERIFY & CONTINUE'),
                ),
          ],
        ),
      ),
    );
  }
}
