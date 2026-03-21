import 'package:dio/dio.dio';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'http://10.0.2.2:5000/api';
  late Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'accessToken');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          final deviceId = await _storage.read(key: 'deviceId');
          if (deviceId != null) {
            options.headers['x-device-id'] = deviceId;
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            // Initiate Token Rotation (assuming cookies or manual refresh depending on backend setup)
            // if refreshToken is stored securely -> dio.post('/auth/refresh')
            // Then retry original request
          }
          return handler.next(e);
        },
      ),
    );
  }
}
