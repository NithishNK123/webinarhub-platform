class Webinar {
  final String id;
  final String title;
  final String description;
  final double price;
  final String domain;
  final double averageRating;
  final int ratingCount;
  final DateTime startTime;
  final DateTime endTime;
  final String hostName;

  Webinar({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.domain,
    required this.averageRating,
    required this.ratingCount,
    required this.startTime,
    required this.endTime,
    required this.hostName,
  });

  factory Webinar.fromJson(Map<String, dynamic> json) {
    return Webinar(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      price: json['price']?.toDouble() ?? 0.0,
      domain: json['domain'] ?? 'general',
      averageRating: json['averageRating']?.toDouble() ?? 0.0,
      ratingCount: json['ratingCount'] ?? 0,
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      // Assuming backend joins host name or defaults if not sent precisely
      hostName: json['host']?['name'] ?? 'Unknown Host',
    );
  }
}
