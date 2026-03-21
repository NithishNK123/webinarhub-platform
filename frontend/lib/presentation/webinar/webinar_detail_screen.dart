import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../domain/models/webinar_model.dart';
import '../../domain/repositories/payment_repository.dart';
import '../../core/network/api_client.dart';
import '../chat/chat_screen.dart';

class WebinarDetailScreen extends StatefulWidget {
  final Webinar webinar;
  const WebinarDetailScreen({super.key, required this.webinar});

  @override
  State<WebinarDetailScreen> createState() => _WebinarDetailScreenState();
}

class _WebinarDetailScreenState extends State<WebinarDetailScreen> {
  final _paymentRepo = PaymentRepository(ApiClient());
  late Razorpay _razorpay;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _initiateCheckout() async {
    setState(() => _isLoading = true);
    try {
      if (widget.webinar.price == 0) {
        // Free logic via join directly or 0-cost backend register
        await _joinWebinar();
        return;
      }

      // 1. Create Order on Backend
      final orderData = await _paymentRepo.createOrder(widget.webinar.id);
      
      // 2. Open Razorpay Checkout
      var options = {
        'key': 'rzp_test_YourKeyIdHere', // Setup securely in real env
        'amount': orderData['amount'],
        'name': 'Webinar Hub',
        'description': widget.webinar.title,
        'order_id': orderData['orderId'],
        'prefill': {
          'contact': '9876543210',
          'email': 'user@example.com'
        }
      };
      
      _razorpay.open(options);

    } catch (e) {
      if(mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if(mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      setState(() => _isLoading = true);
      // 3. Verify Payment on Backend
      await _paymentRepo.verifyPayment({
        'razorpay_payment_id': response.paymentId,
        'razorpay_order_id': response.orderId,
        'razorpay_signature': response.signature,
      });
      
      if(mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful! You are registered.')));
      
      // Navigate to chat/join
      await _joinWebinar();

    } catch (e) {
       if(mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if(mounted) setState(() => _isLoading = false);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed: ${response.message}'), backgroundColor: Colors.red));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('External Wallet Selected: ${response.walletName}')));
  }

  Future<void> _joinWebinar() async {
     try {
       // Request secure burn-after-reading token
       final joinTokenUrl = await _paymentRepo.getJoinToken(widget.webinar.id);
       // Token usually includes the JWT in the URL or header logic for sockets
       
       if (mounted) {
         Navigator.pushReplacement(context, MaterialPageRoute(
           builder: (_) => ChatScreen(webinarId: widget.webinar.id, title: widget.webinar.title)
         ));
       }
     } catch (e) {
        if(mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
     }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Webinar Details')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.webinar.title, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('Hosted by: ${widget.webinar.hostName}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text(widget.webinar.description),
            const SizedBox(height: 24),
            Text('Price: ${widget.webinar.price == 0 ? "FREE" : "\$${widget.webinar.price}"}', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.green)),
            const Spacer(),
            _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : ElevatedButton(
                  onPressed: _initiateCheckout,
                  style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50)),
                  child: Text(widget.webinar.price == 0 ? 'JOIN FOR FREE' : 'PAY & REGISTER'),
                )
          ],
        ),
      ),
    );
  }
}
