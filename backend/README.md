# Hospital Management System

Full-stack hospital management app built with Node.js, Express, MongoDB, and React.

## Backend

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5001`.

Create a `.env` file in the backend folder:

```env
MONGO_URI=mongodb://127.0.0.1:27017/hms
PORT=5001
```

Before starting the backend, make sure MongoDB is running locally. On macOS with Homebrew, you can run:

```bash
brew services start mongodb-community
```

If you do not have a local MongoDB service, use a MongoDB Atlas URI in `MONGO_URI` instead.

## Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The React app runs on `http://localhost:5173` and proxies `/api` requests to the backend.

## API Routes

- `GET /api/patients`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`
- `GET /api/doctors`
- `POST /api/doctors`
- `PUT /api/doctors/:id`
- `DELETE /api/doctors/:id`
- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `DELETE /api/appointments/:id`

## CSV Seed Data

Sample CSV files are available in `backend/data`:

- `patients.csv`
- `doctors.csv`
- `appointments.csv`

Import them into MongoDB through the backend models:

```bash
cd backend
npm run seed:csv
```

To remove existing records first and then import the CSV data:

```bash
cd backend
npm run seed:csv -- --clear
```
