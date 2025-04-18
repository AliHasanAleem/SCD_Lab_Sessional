const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb://localhost:27017/cafe_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const customerSchema = new mongoose.Schema({
    customerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    loyaltyPoints: { type: Number, default: 0 }
});

const Customer = mongoose.model('Customer', customerSchema);

app.use(express.json());

app.get('/customers/:customerId/points', async (req, res) => {
    try {
        const customer = await Customer.findOne({ customerId: req.params.customerId });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ 
            customerId: customer.customerId,
            loyaltyPoints: customer.loyaltyPoints,
            rewardsAvailable: customer.loyaltyPoints >= 20 ? ['Free Coffee'] : []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/customers/points', async (req, res) => {
    try {
        const { customerId, points } = req.body;
        const customer = await Customer.findOneAndUpdate(
            { customerId },
            { $inc: { loyaltyPoints: points } },
            { new: true }
        );
        res.json({ 
            message: 'Points updated successfully',
            currentPoints: customer.loyaltyPoints
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const port = 3002;
app.listen(port, () => {
    console.log(`Customer Service running on http://localhost:${port}`);
});