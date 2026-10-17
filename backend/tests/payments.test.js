const crypto = require('crypto');
const request = require('supertest');

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({ id: 'order_test123', amount: 70800, currency: 'INR' }),
    },
  }));
});

// Socket.io emit must not blow up tests — stub getIO.
jest.mock('../sockets', () => ({
  getIO: () => ({ to: () => ({ emit: () => {} }) }),
  initSocket: jest.fn(),
}));

const app = require('../app');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

async function registerAndLogin(role, overrides = {}) {
  const email = overrides.email || `${role}-${Date.now()}@test.com`;
  const payload = {
    name: `Test ${role}`,
    email,
    password: 'Password@123',
    role,
    ...(role === 'doctor' ? { specialization: 'General Physician', consultationFee: 500 } : {}),
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { token: res.body.token, user: res.body.user };
}

async function setupPatientWithPendingAppointment() {
  const { token, user } = await registerAndLogin('patient');
  const docAuth = await registerAndLogin('doctor');

  const doctor = await Doctor.findOne({ user: docAuth.user._id });
  const patient = await Patient.findOne({ user: user._id });

  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    date: new Date('2026-07-01'),
    startTime: '10:00',
    endTime: '10:30',
    consultationFeeSnapshot: doctor.consultationFee,
    status: 'pending_payment',
  });

  return { token, patient, doctor, appointment };
}

describe('POST /api/payments/create-order', () => {
  it('creates an order with server-computed amount, ignoring any client-sent amount', async () => {
    const { token, appointment } = await setupPatientWithPendingAppointment();

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointmentId: appointment._id, amount: 1 }); // client-sent amount must be ignored

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBe('order_test123');
    expect(res.body.keyId).toBeDefined();
    expect(res.body.amount).toBeGreaterThan(100); // not the client's "1"

    const payment = await Payment.findOne({ razorpayOrderId: 'order_test123' });
    expect(payment).not.toBeNull();
    expect(payment.status).toBe('created');
  });

  it('rejects creating an order for an appointment that does not belong to the patient', async () => {
    const { appointment } = await setupPatientWithPendingAppointment();
    const { token: otherToken } = await registerAndLogin('patient');

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ appointmentId: appointment._id });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/payments/verify', () => {
  it('confirms the appointment and marks payment paid on a valid signature', async () => {
    const { token, appointment } = await setupPatientWithPendingAppointment();

    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointmentId: appointment._id });

    const razorpay_order_id = orderRes.body.orderId;
    const razorpay_payment_id = 'pay_test456';
    const razorpay_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.payment.status).toBe('paid');
    expect(verifyRes.body.appointment.status).toBe('confirmed');

    const updatedAppt = await Appointment.findById(appointment._id);
    expect(updatedAppt.status).toBe('confirmed');
  });

  it('rejects verification with an invalid signature and marks payment failed', async () => {
    const { token, appointment } = await setupPatientWithPendingAppointment();

    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointmentId: appointment._id });

    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: orderRes.body.orderId,
        razorpay_payment_id: 'pay_fake',
        razorpay_signature: 'totally-not-a-valid-signature',
      });

    expect(verifyRes.status).toBe(400);

    const payment = await Payment.findOne({ razorpayOrderId: orderRes.body.orderId });
    expect(payment.status).toBe('failed');

    const appt = await Appointment.findById(appointment._id);
    expect(appt.status).toBe('pending_payment'); // must NOT have been confirmed
  });
});
