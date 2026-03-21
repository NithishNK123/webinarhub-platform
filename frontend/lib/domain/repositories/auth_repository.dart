import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/network/api_client.dart';

class AuthRepository {
  final ApiClient apiClient;
  final FlutterSecureStorage storage = const FlutterSecureStorage();

  AuthRepository(this.apiClient);

  Future<void> login(String email, String password) async {
    try {
      final response = await apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      
      final token = response.data['accessToken'];
      await storage.write(key: 'accessToken', value: token);
      
      // Device ID should hypothetically be set on app launch via a UUID generator
      if(await storage.read(key: 'deviceId') == null) {
         await storage.write(key: 'deviceId', value: 'uuid-dummy-device-id');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Login failed');
    }
  }

  Future<void> signup(String name, String email, String phone, String password) async {
    try {
      await apiClient.dio.post('/auth/signup', data: {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
      });
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Signup failed');
    }
  }

  Future<void> logout() async {
    await storage.delete(key: 'accessToken');
    // Note: HttpOnly cookie clearance requires server-side /logout endpoint
  }
}
