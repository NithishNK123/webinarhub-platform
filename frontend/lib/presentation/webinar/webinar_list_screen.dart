import 'package:flutter/material.dart';
import '../../domain/repositories/webinar_repository.dart';
import '../../domain/models/webinar_model.dart';
import '../../core/network/api_client.dart';
import 'webinar_detail_screen.dart';

class WebinarListingScreen extends StatefulWidget {
  const WebinarListingScreen({super.key});

  @override
  State<WebinarListingScreen> createState() => _WebinarListingScreenState();
}

class _WebinarListingScreenState extends State<WebinarListingScreen> {
  final _repo = WebinarRepository(ApiClient());
  List<Webinar> _webinars = [];
  bool _isLoading = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _repo.fetchWebinars(type: _filter);
      setState(() => _webinars = data);
    } catch (e) {
      if(mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if(mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover Webinars'),
        actions: [
          DropdownButton<String>(
            value: _filter,
            items: const [
              DropdownMenuItem(value: 'all', child: Text('All')),
              DropdownMenuItem(value: 'free', child: Text('Free')),
              DropdownMenuItem(value: 'paid', child: Text('Paid')),
            ],
            onChanged: (val) {
              if (val != null) {
                setState(() => _filter = val);
                _loadData();
              }
            },
          )
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView.builder(
            itemCount: _webinars.length,
            itemBuilder: (context, index) {
              final w = _webinars[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  title: Text(w.title),
                  subtitle: Text('${w.hostName} • ${w.domain}\n⭐ ${w.averageRating} (${w.ratingCount})'),
                  isThreeLine: true,
                  trailing: Text(w.price == 0 ? 'FREE' : '\$${w.price.toStringAsFixed(2)}', 
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green)
                  ),
                  onTap: () => Navigator.push(context, MaterialPageRoute(
                    builder: (_) => WebinarDetailScreen(webinar: w)
                  )),
                ),
              );
            },
          ),
    );
  }
}
