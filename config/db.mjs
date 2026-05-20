import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/Users');
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;


const userShema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
        
    },
    phone:{
        type: String,
        required: true
    },
    service:{
        type: String,
        required: true

    },
    company:{
        type: String,
        required: false
    },
    message:{
        type: String,
        required: true
    },
    timestamp:{
        type: Date,
        default: Date.now
    }
   
});
export const User = mongoose.model('User', userShema);