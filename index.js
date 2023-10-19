import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/backend", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Database Connected"))
    .catch((e) => console.log(e));

const userschema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model("User", userschema);

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;

    try {
        if (token) {
            const decoded = jwt.verify(token, "wdqdqddqwdwq");
            req.user = await User.findById(decoded.id);
            next();
        } else {
            res.render("login");
        }
    } catch (error) {
        console.error(error);
        res.render("login");
    }
};


app.get("/register", (req, res) => {
    res.render("register"); // Assuming you have a register.ejs template
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
        return res.redirect("/login");
    }
    const hashedPassword = await bcrypt.hash(password,10)
    user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    // Redirect to login page after successful registration
    res.redirect("/login");
});

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", { name: req.user.name });
});


app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.redirect("/register");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render("login", { email, message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, "wdqdqddqwdwq");
        res.cookie("token", token, { httpOnly: true, expires: new Date(Date.now() + 60 * 1000) });
        res.redirect("/");
    } catch (error) {
        console.error("Error during login:", error);
        res.render("error");
    }
});


app.get("/logout", (req, res) => {
    res.cookie("token", "null", { httpOnly: true, expires: new Date(Date.now()) });
    res.redirect("/");
});

app.get("/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.get("/login", async (req, res) => {
    res.render("login");
});




app.use(express.static(path.join(path.resolve(), "public")));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
