const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();

mongoose.connect('mongodb://localhost:27017/cafe_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    items: [{
        itemId: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: Number,
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

app.use(express.json());

app.post('/orders', async (req, res) => {
    try {
        const { customerId, items } = req.body;

        // Validate with customer service
        const customerResponse = await axios.get(`http://localhost:3002/customers/${customerId}/points`);
        
        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        const order = new Order({
            orderId: 'ORD' + Date.now(),
            customerId,
            items,
            totalAmount
        });
        await order.save();

        // Update inventory
        await axios.post('http://localhost:3004/inventory/update', { items });

        // Update loyalty points
        await axios.post('http://localhost:3002/customers/points', {
            customerId,
            points: Math.floor(totalAmount)
        });

        res.status(201).json({ order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const port = 3005;
app.listen(port, () => {
    console.log(`Order Service running on http://localhost:${port}`);
});