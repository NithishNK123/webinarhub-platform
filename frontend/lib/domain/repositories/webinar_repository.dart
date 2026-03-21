import 'package:dio/dio.dart';
import '../../core/network/api_client.dart';
import '../models/webinar_model.dart';

class WebinarRepository {
  final ApiClient apiClient;

  WebinarRepository(this.apiClient);

  Future<List<Webinar>> fetchWebinars({String type = 'all'}) async {
    try {
      final response = await apiClient.dio.get('/webinars', queryParameters: {
        'type': type, // 'free' or 'paid' or 'all'
      });
      final List data = response.data;
      return data.map((json) => Webinar.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Failed to load webinars');
    }
  }

  Future<Webinar> fetchWebinarDetails(String id) async {
      try {
        final response = await apiClient.dio.get('/webinars/$id');
        return Webinar.fromJson(response.data);
      } on DioException catch(e){
        throw Exception(e.response?.data['error'] ?? 'Failed to load details');
      }
  }
}
