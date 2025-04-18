const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb://localhost:27017/cafe_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { 
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

app.use(express.json());

app.post('/payments', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId, amount } = req.body;
        
        const payment = new Payment({
            paymentId: 'PAY' + Date.now(),
            orderId,
            amount
        });
        await payment.save({ session });

        payment.status = 'COMPLETED';
        await payment.save({ session });

        await session.commitTransaction();
        res.json({ 
            message: 'Payment processed successfully',
            paymentId: payment.paymentId
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

const port = 3003;
app.listen(port, () => {
    console.log(`Payment Service running on http://localhost:${port}`);
});