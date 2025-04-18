const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb://localhost:27017/cafe_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const inventorySchema = new mongoose.Schema({
    itemId: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

app.use(express.json());

app.post('/inventory/update', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items } = req.body;
        const updates = [];

        for (const item of items) {
            const update = await Inventory.findOneAndUpdate(
                { itemId: item.itemId },
                { $inc: { quantity: -item.quantity } },
                { new: true, session }
            );
            if (!update || update.quantity < 0) {
                throw new Error(`Insufficient stock for item ${item.itemId}`);
            }
            updates.push(update);
        }

        await session.commitTransaction();
        res.json({ message: 'Inventory updated successfully', updates });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

const port = 3004;
app.listen(port, () => {
    console.log(`Inventory Service running on http://localhost:${port}`);
});