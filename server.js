const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Service URLs
const SERVICES = {
    MENU: 'http://localhost:3001',
    CUSTOMER: 'http://localhost:3002',
    PAYMENT: 'http://localhost:3003',
    INVENTORY: 'http://localhost:3004',
    ORDER: 'http://localhost:3005'
};

// Menu Service Routes
app.get('/menu', async (req, res) => {
    try {
        const response = await axios.get(`${SERVICES.MENU}/menu`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Menu service error', error: error.message });
    }
});

app.post('/menu', async (req, res) => {
    try {
        const response = await axios.post(`${SERVICES.MENU}/menu`, req.body);
        res.status(201).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Menu service error', error: error.message });
    }
});

// Customer Service Routes
app.get('/customers/:customerId/points', async (req, res) => {
    try {
        const response = await axios.get(`${SERVICES.CUSTOMER}/customers/${req.params.customerId}/points`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Customer service error', error: error.message });
    }
});

app.post('/customers/points', async (req, res) => {
    try {
        const response = await axios.post(`${SERVICES.CUSTOMER}/customers/points`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Customer service error', error: error.message });
    }
});

// Payment Service Route
app.post('/payments', async (req, res) => {
    try {
        const response = await axios.post(`${SERVICES.PAYMENT}/payments`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Payment service error', error: error.message });
    }
});

// Inventory Service Route
app.post('/inventory/update', async (req, res) => {
    try {
        const response = await axios.post(`${SERVICES.INVENTORY}/inventory/update`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Inventory service error', error: error.message });
    }
});

// Order Service Route
app.post('/orders', async (req, res) => {
    try {
        // 1. Check customer points
        const customerResponse = await axios.get(
            `${SERVICES.CUSTOMER}/customers/${req.body.customerId}/points`
        );

        // 2. Create order
        const orderResponse = await axios.post(`${SERVICES.ORDER}/orders`, req.body);

        // 3. Process payment
        const paymentResponse = await axios.post(`${SERVICES.PAYMENT}/payments`, {
            orderId: orderResponse.data.order.orderId,
            amount: orderResponse.data.order.totalAmount
        });

        res.status(201).json({
            order: orderResponse.data.order,
            payment: paymentResponse.data,
            customer: customerResponse.data
        });
    } catch (error) {
        res.status(500).json({ message: 'Order processing error', error: error.message });
    }
});

// Health Check Routes
app.get('/health', async (req, res) => {
    try {
        const health = {
            menu: await checkServiceHealth(SERVICES.MENU),
            customer: await checkServiceHealth(SERVICES.CUSTOMER),
            payment: await checkServiceHealth(SERVICES.PAYMENT),
            inventory: await checkServiceHealth(SERVICES.INVENTORY),
            order: await checkServiceHealth(SERVICES.ORDER)
        };
        res.json(health);
    } catch (error) {
        res.status(500).json({ message: 'Health check failed', error: error.message });
    }
});

async function checkServiceHealth(serviceUrl) {
    try {
        await axios.get(`${serviceUrl}/health`);
        return 'UP';
    } catch (error) {
        return 'DOWN';
    }
}

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Central Service running on http://localhost:${port}`);
    console.log('Coordinating services:');
    Object.entries(SERVICES).forEach(([name, url]) => {
        console.log(`${name}: ${url}`);
    });
});