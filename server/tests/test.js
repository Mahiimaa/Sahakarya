const { app } = require('../server');
const request = require('supertest');
const mongoose = require('mongoose');

jest.setTimeout(30000); // ✅ increase timeout globally for this test file (30 seconds)

describe('User and Mediation API', () => {
  let adminToken;
  let user1Token;
  let user2Token;
  let bookingId;
  let serviceId;
  let user1Id;
  let user2Id;

  beforeAll(async () => {
    // Admin login
    const adminLogin = await request(app)
      .post('/api/login')
      .send({
        identifier: "sahakarya.help@gmail.com",
        password: "Sysp4mema@"
      });
    expect(adminLogin.statusCode).toBe(200);
    adminToken = adminLogin.body.token;

    // Create user1
    await request(app).post('/api/signup').send({
      username: "User One",
      email: "user1@example.com",
      password: "Password123@",
      confirmPassword: "Password123@"
    });

    const user1Login = await request(app)
      .post('/api/login')
      .send({
        identifier: "user1@example.com",
        password: "Password123@"
      });
    expect(user1Login.statusCode).toBe(200);
    user1Token = user1Login.body.token;
    user1Id = user1Login.body.userId;

    // Create user2
    await request(app).post('/api/signup').send({
      username: "User Two",
      email: "user2@example.com",
      password: "Password123@",
      confirmPassword: "Password123@"
    });

    const user2Login = await request(app)
      .post('/api/login')
      .send({
        identifier: "user2@example.com",
        password: "Password123@"
      });
    expect(user2Login.statusCode).toBe(200);
    user2Token = user2Login.body.token;
    user2Id = user2Login.body.userId;

    // Create a service
    const serviceRes = await request(app)
      .post('/api/services') // ⚡ make sure your service create API is correct
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        serviceName: "Test Service",
        serviceDescription: "Test Service Desc",
        timeCredits: 10,
      });
    expect(serviceRes.statusCode).toBe(201);
    serviceId = serviceRes.body._id;

    // Create a booking
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        requesterId: user1Id,
        providerId: user2Id,
        serviceId: serviceId,
        status: "in mediation",
      });
    expect(bookingRes.statusCode).toBe(201);
    bookingId = bookingRes.body._id;
  });

  it('should return all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('should resolve mediation successfully', async () => {
    const res = await request(app)
      .post(`/api/mediation/${bookingId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: "Provider was correct, credits transferred.",
        finaltimeCredits: 10
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Mediation resolved successfully');
    expect(res.body.booking).toHaveProperty('status', 'mediation resolved');
    expect(res.body.booking).toHaveProperty('creditTransferred', true);
  });

  it('should not resolve mediation without decision', async () => {
    const res = await request(app)
      .post(`/api/mediation/${bookingId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        finaltimeCredits: 10
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', "Decision and final timeCredits are required");
  });

  afterAll(async () => {
    // No need otpStore.stopCleanup()
    await mongoose.connection.close();
  });
});
