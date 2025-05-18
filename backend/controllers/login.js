const bcrypt = require('bcrypt');
const loginRouter = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

loginRouter.post('/', async (req, res) => {
    try {
        let { PhoneNumber, password } = req.body;
        PhoneNumber = Number(PhoneNumber);

        if (isNaN(PhoneNumber)) {
            return res.status(400).json({ error: "Invalid phone number format" });
        }

        const user = await User.findOne({ PhoneNumber });
        const passwordCorrect = user && user.passwordHash
            ? await bcrypt.compare(password, user.passwordHash)
            : false;

        if (!user || !passwordCorrect) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        const userForToken = {
            username: user.username,
            id: user.id,
        };

        const token = jwt.sign(userForToken,'defaultSecret');

        res.status(200).send({
            userId: user.id,
            token,
            PhoneNumber: user.PhoneNumber,
            Firstname: user.Firstname,
            lastname: user.lastname,
            Height: user.Height,
            weight: user.weight,
            DOB: user.DOB,
            chats: user.chats
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = loginRouter;
