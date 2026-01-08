const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserService {
    async getListUsers() {
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

    // Bulk create users
    async createUsers(usersArray) {
        try {
            if (!Array.isArray(usersArray) || usersArray.length === 0) {
                throw new Error('Provide an array of users to create');
            }

            // Validate and prepare data
            const toInsert = [];
            for (let idx = 0; idx < usersArray.length; idx++) {
                const u = usersArray[idx];
                if (!u.name || !u.email) {
                    throw new Error(`User at index ${idx} missing required fields (name, email)`);
                }

                // Check for duplicate email in input array
                const emailLower = u.email.toLowerCase();
                const isDuplicateInArray = toInsert.some(item => item.email === emailLower);
                if (isDuplicateInArray) {
                    throw new Error(`Duplicate email at index ${idx}: ${u.email}`);
                }

                // Hash password if provided
                let hashed = null;
                if (u.password) {
                    hashed = await bcrypt.hash(u.password, 10);
                }

                toInsert.push({
                    name: u.name,
                    email: emailLower,
                    password: hashed,
                    role: u.role || 'user'
                });
            }

            // Check for existing emails in DB
            const existingEmails = await User.find({ email: { $in: toInsert.map(u => u.email) } });
            if (existingEmails.length > 0) {
                throw new Error(`Emails already exist: ${existingEmails.map(u => u.email).join(', ')}`);
            }

            const created = await User.insertMany(toInsert);
            // Remove passwords from response
            return created.map(u => {
                const obj = u.toObject();
                delete obj.password;
                return obj;
            });
        } catch (error) {
            throw new Error(`Error bulk creating users: ${error.message}`);
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
