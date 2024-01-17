const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const multer = require('multer');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

require('./mongooseDB/config');

const Category = require('./mongooseDB/Category');
const News = require('./mongooseDB/Post');
const adminUser = require('./mongooseDB/adminUser');
const Image = require('./mongooseDB/image');
const { decode } = require('punycode');
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/admin-news", (req, res) => {
    res.send("Jai Shree Ram");
})


// app.post('/api/signup', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Validate email and password
//         if (!email || !password) {
//             return res.status(400).json({ error: 'Email and password are required.' });
//         }

//         // Hash the password before storing it
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create a new user in the database
//         const user = await adminUser.create({ email, password: hashedPassword });

//         // Log the created user
//         console.log(user);

//         // Respond with a success message and the user data
//         res.status(201).json({ message: 'User created successfully', user });
//     } catch (error) {
//         console.error(error);
//         // Respond with an error message
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


const user = new adminUser({

    email: "mouryabhaipooja@gmail.com",
    password: "admin123"
});


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user in the database
        const user = await adminUser.findOne({ email, password });

        if (user) {
            // User found, generate JWT token
            const token = jwt.sign({ email: user.email, userId: user._id }, 'iamsareshthemakerofdyanmicwebsite', { expiresIn: '20s' });

            // Include the token in the response
            res.json({ success: true, message: 'Login successful', token });

        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await adminUser.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a unique reset token
        const token = jwt.sign({ id: user._id }, 'secret-key', { expiresIn: '2m' });

        // Send a password reset email to the user
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'anm2115ppat@gmail.com', // Replace with your email
                pass: 'wnku tsej ozos zlrd ', // Replace with your email password
            },
        });

        const mailOptions = {
            from: 'anm2115ppat@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n`
                + `Please click on the following link within 2min after this link will be expires`
                + `http://localhost:5173/reset-password/${user._id}/${token}\n\n`
                + `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }

            return res.json({ message: 'Password reset email sent successfully Check Your Email' });
        });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/reset-password/:id/:token', (req, res) => {
    const { id, token } = req.params
    const { password } = req.body

    jwt.verify(token, "secret-key", (err, decoded) => {
        if (err) {
            return res.json({ Status: "Error with token" });
        } else {
            adminUser.findByIdAndUpdate({ _id: id }, { password }).then(u => res.send({ Status: "Success" })).catch(err => console.log(err))
        }
    })
})










const image = multer.diskStorage({
    destination: '../frontend/public/images',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const img = multer({ storage: image });

app.post('/api/uploadImage', img.single('image'), async (req, res) => {
    try {
        // Save the image details to the database
        const image = req.file ? `/uploads/${req.file.filename}` : null;
        const newImage = new Image({
            image
        });

        await newImage.save();

        res.status(201).json({ message: ' successfully' });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//  Get all posts
app.get('/api/get/image', async (req, res) => {
    try {
        const posts = await Image.find();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});











//Add news All Api

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: '../frontend/public/uploads',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Store  to handle news post
app.post('/api/news', upload.single('imageUpload'), async (req, res) => {
    try {
        const { title, description, city, state, category, keyword } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const newNews = new News({
            title,
            description,
            image,
            city,
            state,
            category,
            keyword,
        });

        News.timestamp = new Date();

        await newNews.save();
        res.status(201).json({ message: 'News posted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// API endpoint for editing news
app.put('/api/edit/news/:id', upload.single('imageUpload'), async (req, res) => {
    try {
        const newsId = req.params.id;
        const { title, description, city, state, category, keyword } = req.body;
        let image;

        // Check if a new file is provided
        if (req.file) {
            image = `/uploads/${req.file.filename}`; // Set to new image path
        } else {
            // No new file provided, use the existing image path
            const existingNews = await News.findById(newsId);
            if (existingNews) {
                image = existingNews.image;
            } else {
                return res.status(404).json({ error: 'News not found' });
            }
        }

        // Find the news item by ID and update its fields
        const updatedNews = await News.findByIdAndUpdate(
            newsId,
            {
                title,
                description,
                city,
                state,
                category,
                keyword,
                image,
                timestamp: new Date(),
            },
            { new: true } // Return the updated news item
        );

        if (!updatedNews) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json({ message: 'News updated successfully', updatedNews });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const uploadFolder = path.join(__dirname, '../frontend/public/uploads');
// API endpoint for deleting news
app.delete('/api/delete/news/:id', async (req, res) => {
    try {
        const newsId = req.params.id;

        // Find the news item by ID and remove it
        const deletedNews = await News.findByIdAndDelete(newsId);

        if (!deletedNews) {
            return res.status(404).json({ error: 'News not found' });
        }

        // Remove the associated image file
        if (deletedNews.image) {
            const imagePath = path.join(uploadFolder, path.basename(deletedNews.image));
            fs.unlinkSync(imagePath);
        }

        res.json({ message: 'News deleted successfully', deletedNews });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//  Get all posts
app.get('/api/get/news', async (req, res) => {
    try {
        const posts = await News.find();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/get/news/:id', async (req, res) => {
    try {

        const post = await News.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Error fetching news post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/get/category/:category', async (req, res) => {
    try {
        const category = req.params.category;

        // Find all news posts with the specified category
        const posts = await News.find({ category });

        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: 'News not found for the specified category' });
        }

        res.json(posts);
    } catch (error) {
        console.error('Error fetching news posts by category:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// New route to handle updating likes
app.post('/api/like/news/:id', async (req, res) => {
    try {
        const post = await News.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'News not found' });
        }

        // Increment the likes count
        post.likes += 1;

        // Save the updated post
        await post.save();

        res.json({ likes: post.likes });
    } catch (error) {
        console.error('Error updating likes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET route to retrieve likes for a news post
app.get('/api/get/like/news/:id', async (req, res) => {
    try {
        const post = await News.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json({ likes: post.likes });
    } catch (error) {
        console.error('Error retrieving likes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





// Search for news by keyword
app.get('/api/search/news', async (req, res) => {
    try {
        const keyword = req.query.keyword;

        if (!keyword) {
            return res.status(400).json({ error: 'Keyword parameter is required' });
        }

        // Perform the search
        const searchResults = await News.find(
            {
                $or: [
                    { title: { $regex: new RegExp(keyword, 'i') } },  // Case-insensitive title search
                    { content: { $regex: new RegExp(keyword, 'i') } } // Case-insensitive content search
                    // Add more fields as needed for your specific use case
                ]
            }
        );

        if (searchResults.length === 0) {
            return res.status(404).json({ error: `No news found for the keyword '${keyword}'` });
        }

        res.json(searchResults);
    } catch (error) {
        console.error('Error searching news:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




//Category Api 

// Create a new category
app.post('/api/categories', async (req, res) => {
    try {
        const { name } = req.body;
        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update a category
app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );
        res.json(updatedCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a category
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Api to get all categories
app.get('/api/get/categories', async (req, res) => {
    try {
        const categories = await Category.find({}, 'name'); // Assuming your category model has a 'name' field
        res.json(categories.map(category => category.name));
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//Categories Api End





const port = process.env.PORT || 511;
app.listen(port, () => {
    console.log(`Server is starting in Port number ${port}`);
})














// const express = require('express');
// const app = express();

// // Create an object to store the count for each article
// const articleOpenCounts = {};

// app.get("/", (req, res) => {
//   const articleId = req.params.id;

//   // If the article is accessed for the first time, initialize the count to 1
//   articleOpenCounts[articleId] = (articleOpenCounts[articleId] || 0) + 1;

//   res.send(`Article ${articleId} has been opened ${articleOpenCounts[articleId]} times.`);
// });

// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });

