const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserService {
    async listUsers() {
        try {
            return await User.find().select('-password');
        } catch (error) {
            throw new Error(`Error listing users: ${error.message}`);
        }
    }

    async getUserById(id) {
        try {
            const user = await User.findById(id).select('-password');
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            throw new Error(`Error getting user: ${error.message}`);
        }
    }

    async createUser(userData) {
        try {
            const { name, email, password, role } = userData;
            
            if (!name || !email) {
                throw new Error('Name and email are required');
            }

            const existing = await User.findOne({ email: email.toLowerCase() });
            if (existing) {
                throw new Error('User already exists');
            }

            let hashed = null;
            if (password) {
                hashed = await bcrypt.hash(password, 10);
            }

            const newUser = new User({
                name,
                email: email.toLowerCase(),
                password: hashed,
                role: role || 'user'
            });

            await newUser.save();
            const userObj = newUser.toObject();
            delete userObj.password;
            return userObj;
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    async updateUser(id, updateData) {
        try {
            const user = await User.findById(id);
            if (!user) {
                throw new Error('User not found');
            }

            if (updateData.password) {
                user.password = await bcrypt.hash(updateData.password, 10);
                delete updateData.password;
            }

            Object.keys(updateData).forEach(k => {
                user[k] = updateData[k];
            });

            await user.save();
            const userObj = user.toObject();
            delete userObj.password;
            return userObj;
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    async deleteUser(id) {
        try {
            const user = await User.findByIdAndDelete(id);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }
}

module.exports = new UserService();
