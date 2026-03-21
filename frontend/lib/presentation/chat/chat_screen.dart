import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ChatScreen extends StatefulWidget {
  final String webinarId;
  final String title;
  const ChatScreen({super.key, required this.webinarId, required this.title});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  late IO.Socket _socket;
  final List<String> _messages = [];
  final _messageController = TextEditingController();
  final _storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    _initSocket();
  }

  Future<void> _initSocket() async {
    final token = await _storage.read(key: 'accessToken');
    
    _socket = IO.io('http://10.0.2.2:5000', IO.OptionBuilder()
        .setTransports(['websocket'])
        .setExtraHeaders({'Authorization': 'Bearer $token'})
        .build());

    _socket.onConnect((_) {
      _socket.emit('joinRoom', widget.webinarId);
    });

    _socket.on('message', (data) {
      if (mounted) {
        setState(() {
          _messages.add(data['content'] ?? data.toString());
        });
      }
    });

    _socket.on('error', (err) {
       if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err.toString()), backgroundColor: Colors.red));
    });
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      _socket.emit('chatMessage', {
        'webinarId': widget.webinarId,
        'content': _messageController.text.trim()
      });
      _messageController.clear();
    }
  }

  @override
  void dispose() {
    _socket.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Live: ${widget.title}')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return ListTile(
                  title: Text(_messages[index]),
                  leading: const Icon(Icons.person),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(hintText: 'Type a message...'),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
