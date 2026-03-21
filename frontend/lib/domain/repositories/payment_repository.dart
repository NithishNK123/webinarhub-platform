import 'package:dio/dio.dart';
import '../../core/network/api_client.dart';

class PaymentRepository {
  final ApiClient apiClient;

  PaymentRepository(this.apiClient);

  Future<Map<String, dynamic>> createOrder(String webinarId) async {
    try {
      final response = await apiClient.dio.post('/payments/orders', data: {
        'webinarId': webinarId,
        'currency': 'INR'
      });
      return response.data; // { orderId, amount, currency }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Order creation failed');
    }
  }

  Future<bool> verifyPayment(Map<String, dynamic> payload) async {
    try {
      await apiClient.dio.post('/payments/verify', data: payload);
      return true;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Payment verification failed');
    }
  }

  Future<String> getJoinToken(String webinarId) async {
    try {
      final response = await apiClient.dio.get('/join/$webinarId');
      return response.data['joinUrl']; // Burn-after-reading token URL
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Failed to generate join token');
    }
  }
}
