const express = require(`express`);
const path = require("path");
const bcrypt = require("bcrypt");
const app=express();
const cloudinary = require('cloudinary').v2;
const multer=require('multer');
const collection=require("./config");
const session = require('express-session');
const ExcelJS = require('exceljs');
const fs = require('fs');


app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.set('view engine','ejs');

app.use(express.static("public"));

app.use('/models', express.static('models'));
app.use('/labels', express.static('labels'));

cloudinary.config({
    cloud_name: 'dlvxkp5bw',
    api_key: '241529563729845',
    api_secret: 'mcSr8WKBeVt3L9neg3PN5l8iJmY'
});

async function createAdmin() {
    try {
        const adminExists = await collection.findOne({ name: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('aryan', 10); 

            const adminData = {
                name: 'admin',
                password: hashedPassword,
                Gsuite: 'admin@iiest.in',
                enrollment_number: '0',
                department: 'NULL',
                mobile: '9068389990',
                year: '0',
                isAdmin: true
            };

            await collection.create(adminData);
            console.log("Admin user created successfully");
        } else {
            console.log("Admin user already exists");
        }
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
}

createAdmin();


app.get("/",(req,res)=>{
    res.render("login");
});


app.get("/signup",(req,res)=>{
    res.render("signup");
});

app.get("/adminlogin",(req,res)=>{
    res.render("adminlogin");
});



const upload = multer({ dest: 'uploads/' });
app.post("/signup", upload.single('userImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

    
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'user_images', 
            overwrite: true 
        });

        
        const data = {
            name: req.body.username,
            password: req.body.password,
            Gsuite: req.body.Gsuite,
            enrollment_number: req.body.enrollment_number,
            department: req.body.department,
            mobile: req.body.mobile,
            year: req.body.year,
            userImage: result.secure_url 
        };

        const existing_user =  await collection.findOne({ 
            $or: [
                { Gsuite: data.Gsuite },
                { enrollment_number: data.enrollment_number }
            ]
        });
        if (existing_user) {
            return res.send("Already registered");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;

        await collection.create(data);
        console.log("User signed up:", data);
        res.send("Wait for admin approval");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error signing up");
    }
});

const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        // If user is logged in, proceed to the next middleware
        next();
    } else {
        // If user is not logged in, redirect to the login page
        res.redirect('/login');
    }
};

// app.post("/login", async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await collection.findOne({ name: username });

//         if (!user || username === 'admin') {
//             return res.send("User not found");
//         }

//         if (!user.approved) {
//             return res.send("User not yet approved");
//         }

//         if (!user.active) {
//             return res.send("User is inactive");
//         }

//         const isPasswordMatch = await bcrypt.compare(password, user.password);

//         if (isPasswordMatch) {
//             res.render("home", { user });
//         } else {
//             res.send("Incorrect password");
//         }
//     } catch (error) {
//         console.error("Error logging in:", error);
//         res.status(500).send("Internal Server Error");
//     }
// });

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await collection.findOne({ name: username });

        if (!user || username === 'admin') {
            return res.send("User not found");
        }

        if (!user.approved) {
            return res.send("User not yet approved");
        }

        if (!user.active) {
            return res.send("User is inactive");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (isPasswordMatch) {
            // Update logged to true
            await collection.findByIdAndUpdate(user._id, { logged: true });
            res.render("home", { user });
        } else {
            res.send("Incorrect password");
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/logout", async (req, res) => {
    try {
        const userId = req.query.userId;  // Fetch userId from query parameters

        // Update logged to false
        await collection.findByIdAndUpdate(userId, { logged: false });
        res.send("Logged out successfully");
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).send("Internal Server Error");
    }
});






app.get('/attendancestats', async (req, res) => {
    try {
        // Find a user with logged field set to true
        const user = await collection.findOne({ logged: true });

        if (!user) {
            return res.status(400).send('No logged in user found');
        }

        const userName = user.name;
        console.log(userName);

        // Path to the user's Excel file
        const filePath = path.join(__dirname, '..', `${userName}.xlsx`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        // Read Excel file using ExcelJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];  // Access the first worksheet

        // Convert sheet data to an array of objects
        const attendanceData = worksheet.getSheetValues().map(row => ({
            Date: row[2],
            Time: row[3],
            Status: row[4]
        }));
        console.log(attendanceData);
        // Render the EJS template with user and attendanceData
        res.render('attendancestats', { user, attendanceData });

    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/approved/stats/:userId', async (req, res) => {
    try {
        // Retrieve userId from request parameters and trim extra spaces
        const userId = req.params.userId.trim();

        // Validate userId format
       
        // Find a user by userId
        const user = await collection.findOne({ _id: userId });

        if (!user) {
            return res.status(400).send('User not found');
        }

        const userName = user.name;
        console.log(userName);

        // Path to the user's Excel file
        const filePath = path.join(__dirname, '..', `${userName}.xlsx`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        // Read Excel file using ExcelJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];  // Access the first worksheet

        // Convert sheet data to an array of objects
        const attendanceData = worksheet.getSheetValues().map(row => ({
            Date: row[2],
            Time: row[3],
            Status: row[4]
        }));
        console.log(attendanceData);

        // Render the EJS template with user and attendanceData
        res.render('approvedstats', { user, attendanceData });

    } catch (error) {
        console.error('Error fetching attendance data:', error);
        res.status(500).send('Internal server error');
    }
});

app.post("/adminlogin", async (req, res) => {
    try {
        const check = await collection.findOne({ name: 'admin' }); 

        if (!check) {
            return res.send("Unauthorised access");
        }

        const isPassMatch = await bcrypt.compare(req.body.password, check.password);

        if (isPassMatch) {
            const pendingUsers = await collection.find({ approved: false });
            return res.render("admin_dashboard", {pendingUsers});
        } else {
            return res.send("Wrong password");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error logging in");
    }
});

const isAdminAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(403).send("Access Denied: You are not authorized to access this page.");
};


app.get("/adminlogin/admindashboard", isAdminAuthenticated, async (req, res) => {
    try {
        const pendingUsers = await collection.find({ approved: false });
        res.render("admin_dashboard", { pendingUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error retrieving pending users" });
    }
});

app.get("/adminlogin/admindashboard/approveduser",async (req,res)=>{
    try {
        const approvedUsers = await collection.find({ approved: true });
        res.render('approveduser', { approvedUsers });
    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).send('Internal Server Error');
    }

});

// Route to approve a user
app.patch('/admin/approve/:userId', async (req, res) => {
    const { userId } = req.params;
    const { approved } = req.body;

    try {
        // Update user approval status in the database
        await collection.findByIdAndUpdate(userId, { approved });

        res.sendStatus(200); // Send success status
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to deny a user
app.delete('/admin/deny/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Delete the user from the database
        await collection.findByIdAndDelete(userId);

        res.sendStatus(200); // Send success status
    } catch (error) {
        console.error('Error denying user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.patch('/adminlogin/admindashboard/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Find the user by ID
        const user = await collection.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Toggle the approval status
        user.approved = !user.approved;

        // Save the updated user
        await user.save();

        res.sendStatus(200); // Send success status
    } catch (error) {
        console.error('Error toggling user approval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('adminlogin/admindashboard/approveduser/:userId', async (req, res) => {
    try {
        const approvedUsers = await collection.find({ approved: true });
        res.render('approveduser', { approvedUsers });
    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.patch('/adminlogin/admindashboard/approveduser/:userId', async (req, res) => {
    const userId = req.params.userId;
    const newActiveStatus = req.body.active;

    try {
        const user = await collection.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the active status
        user.active = newActiveStatus;

        // Save the updated user
        await user.save();

        res.status(200).json({ message: 'User active status updated successfully', user });
    } catch (error) {
        console.error('Error updating user active status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/mark",(req,res)=>{
    res.render("mark");
})


app.post('/mark', async (req, res) => {
    try {
        const { label } = req.body;

        console.log('Received label:', label);

        if (!label) {
            return res.status(400).json({ message: 'Face label is required' });
        }

        const mainDirPath = path.join(__dirname, '..');  // Main directory path

        if (!fs.existsSync(mainDirPath)) {
            fs.mkdirSync(mainDirPath);
        }

        const name = label.split(' ')[0];
        const filePath = path.join(mainDirPath, `${name}.xlsx`);

        // Check if the file exists, if not create it
        if (!fs.existsSync(filePath)) {
            console.warn('attendance.xlsx not found. Creating a new workbook...');
            
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Attendance');
            
            // Add headers
            worksheet.addRow(['Label', 'Status', 'Date', 'Time']);
            
            await workbook.xlsx.writeFile(filePath);
            console.log('New workbook created successfully');
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        console.log('Workbook loaded');

        const worksheet = workbook.getWorksheet('Attendance');

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        const row = worksheet.findRow(label, 1, 'A');

        // Check if date is today's date in MongoDB
        const user = await collection.findOne({ name: name });
        
        if (user && user.date === formattedDate) {
            console.log('Already marked for today');
            return res.send("marked");
        }

        if (row) {
            row.getCell('B').value = 'Present';
            row.getCell('C').value = formattedDate;
            row.getCell('D').value = formattedTime;
        } else {
            worksheet.addRow([label.split(' ')[0], 'Present', formattedDate, formattedTime]);
        }

        await workbook.xlsx.writeFile(filePath);

        // Update date in MongoDB
        await collection.updateOne({ name: name }, { date: formattedDate });

        console.log('Attendance marked successfully');
        
        // Send success response
        res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
        console.error('Error marking attendance:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// app.get("/adminlogin",(req,res)=>{
//     res.render("adminlogin");
// })

const port=5000;
app.listen(port,()=>{
    console.log(`server running on port ${port}`);
}
)