# Sahakarya – Service Exchange Platform

This project uses the MERN stack: **MongoDB**, **Express.js**, **React.js**, and **Node.js**.
Below are the steps to set it up on a new system.

---

## 🔧 Prerequisites

Make sure the following tools are installed:

- Node.js (v16 or higher): https://nodejs.org
- MongoDB (local instance): https://www.mongodb.com/try/download/community
- npm (comes with Node.js)
- Git (optional, for cloning)

## Backend Setup

1. Open a terminal and navigate to the server directory:

```bash
cd server
npm install
```

2. Create a `.env` file in `server/` based on the provided `.env.example`:

``
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sahakarya
JWT_SECRET=your_jwt_secret

````

3. Start the backend server:

```bash
npm run dev
````

---

## Frontend Setup

1. Open a second terminal and go to the client folder:

```bash
cd client
npm install
```

2. Start the React development server:

```bash
npm start
```

The frontend will run on [http://localhost:3000](http://localhost:3000)

---

## Importing MongoDB Database

1. Make sure MongoDB is installed and running.
2. Use the following command to import the database:

```bash
mongoimport --db sahakarya --collection users --file ./Database/sahakarya_db.json --jsonArray
```

Repeat this for each collection (e.g., `services`, `bookings`, etc.) if your export includes multiple files.

---

## Accessing the App

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

## Notes

- Do not commit `.env` files.
- You can modify `MONGO_URI` if using a cloud DB like MongoDB Atlas.
- Ensure ports 3000 (React) and 8000 (Node.js) are free.

---

## Support

For setup help, contact the developer team at sahakarya.help@gmail.com.
