import express from 'express';
import cors from 'cors';
import connectDB from './config/db.mjs';
import userRoutes from './Routes/Users.mjs';

const app = express();
app.use(cors());
app.use(express.json());
// connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.use(userRoutes);

const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});