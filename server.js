const express = require('express');
const bodyParser = require('body-parser');
const { connectDB, User } = require('./database');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`)
  }
});

const upload = multer({ extended: true});

app.get('/', (req, res) => {
  res.send('Welcome to the Trail Tracker API');
});

app.post('/api/users/register', async (req, res) => {
  const { username, password, name, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ username, password: hashedPassword, name, email, profile_picture_url: '/static/default_profile.png' });
    await user.save();
    res.status(201).json({ message: `User ${username} registered successfully!` });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Username already exists. Try a different one.' });
    } else {
      res.status(500).json({ message: 'Error registering user' });
    }
  }
});

app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;

  // Log the request body to check what is being sent
  console.log('Login request body:', req.body);

  try {
    const user = await User.findOne({ username });

    // Log the user data found in the database
    console.log('User found:', user);

    if (user && await bcrypt.compare(password, user.password)) {
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(400).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});


app.post('/api/users/log-scan', async (req, res) => {
  const { username, filepath,camera_id, animal, pulled_data, date, time } = req.body;
  try {
    const existingUpload = await User.findOne({ username, 'uploads.filepath': filepath });
    if (existingUpload) {
      return res.status(400).json({ message: 'File already uploaded' });
    }

    const result = await User.updateOne({ username }, {
      $push: {
        uploads: { filepath,camera_id, animal, pulled_data, date, time }
      }
    });
    console.log('Upload metadata logged to database:', result);
    res.status(200).json({ message: 'Scan logged successfully' });
  } catch (err) {
    console.error('Error logging scan:', err);
    res.status(500).json({ message: 'Error logging scan' });
  }
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  res.status(200).json({ users });
});

app.post('/api/users/save_location', async (req, res) => {
  const { username, latitude, longitude } = req.body;
  await User.updateOne({ username }, {
    $set: { location: { latitude, longitude } }
  });
  res.status(200).json({ message: 'Location saved successfully' });
});

app.post('/api/users/save_pin', async (req, res) => {
    const { username, name, camera_id, latitude, longitude } = req.body;
    try {
        await User.updateOne(
            { username },
            { $push: { gps_pins: { name, camera_id, latitude, longitude } } }
        );
        res.status(200).json({ status: 'success', message: 'Pin saved successfully' });
    } catch (err) {
        console.error('Error saving pin:', err);
        res.status(500).json({ status: 'error', message: 'Error saving pin' });
    }
});
app.post('/api/users/get_pins', async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user) {
            res.status(200).json({ status: 'success', pins: user.gps_pins });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching pins:', err);
        res.status(500).json({ status: 'error', message: 'Error fetching pins' });
    }
});

app.put('/api/users/update_pin/:camera_id', async (req, res) => {
    const { camera_id } = req.params;
    const { username, name, new_camera_id, latitude, longitude } = req.body;
    try {
        const user = await User.findOne({ username });
        const pinIndex = user.gps_pins.findIndex(pin => pin.camera_id === camera_id);
        if (pinIndex !== -1) {
            user.gps_pins[pinIndex].name = name;
            user.gps_pins[pinIndex].latitude = latitude;
            user.gps_pins[pinIndex].longitude = longitude;
            user.gps_pins[pinIndex].camera_id = new_camera_id;
            await user.save();
            res.status(200).json({ status: 'success', message: 'Pin updated successfully' });
        } else {
            res.status(404).json({ status: 'error', message: 'Pin not found' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error updating pin' });
    }
});

app.delete('/api/users/delete_pin/:camera_id', async (req, res) => {
    const { camera_id } = req.params;
    const { username } = req.body;
    console.log(`DELETE request received for camera_id: ${camera_id}, username: ${username}`);

    try {
        const result = await User.updateOne(
            { username },
            { $pull: { gps_pins: { camera_id } } }
        );
        console.log('Database update result:', result);
        if (result.modifiedCount > 0) {
            console.log('Pin deleted successfully');
            res.status(200).json({ status: 'success', message: 'Pin deleted successfully' });
        } else {
            console.log('Pin not found');
            res.status(404).json({ status: 'error', message: 'Pin not found' });
        }
    } catch (err) {
        console.error('Error deleting pin:', err);
        res.status(500).json({ status: 'error', message: 'Error deleting pin' });
    }
});

app.post('/api/users/profile', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

app.post('/api/users/get_uploads_by_camera/:camera_id', async (req, res) => {
  const { camera_id } = req.params;
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    const uploads = user.uploads.filter(upload => upload.camera_id === camera_id);
    res.status(200).json({ status: 'success', uploads });
  } else {
    res.status(404).json({ status: 'error', message: 'User not found' });
  }
});

app.post('/api/users/change_password', async (req, res) => {
  const { username, current_password, new_password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password' });
  }
});
app.post('/api/users/update_profile', upload.single('profile_picture'), async (req, res) => {
    const { current_username, username, profile_picture_url } = req.body;
    console.log(`Received update_profile request: current_username=${current_username}, username=${username}`);

    const updateFields = { username };
    if (profile_picture_url) {
        updateFields.profile_picture_url = profile_picture_url;
    }

    try {
        console.log('Update fields:', updateFields);
        const result = await User.updateOne(
            { username: current_username },
            { $set: updateFields }
        );
        console.log('Update result:', result);

        if (result.matchedCount === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        if (result.modifiedCount > 0) {
            const updatedUser = await User.findOne({ username: username });
            res.status(200).json({ status: 'success', message: 'Profile updated successfully', user: updatedUser });
        } else {
            res.status(400).json({ status: 'error', message: 'Profile update failed' });
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ status: 'error', message: 'Error updating profile' });
    }
});
app.delete('/api/users/delete_upload', async (req, res) => {
  const { username, filepath } = req.body;
  try {
    await User.updateOne({ username }, {
      $pull: { uploads: { filepath } }
    });
    res.status(200).json({ message: 'Upload deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting upload' });
  }
});

app.post('/api/users/get_uploads', async (req, res) => {
    const { username, sort_by, filter_value } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    let uploads = user.uploads;
    let recommendations = [];

    if (sort_by === 'animal' && filter_value) {
        const cameras = [...new Set(user.gps_pins.map(pin => pin.camera_id))];
        const filteredUploads = uploads.filter(upload => upload.animal === filter_value);
        const groupedUploads = cameras.reduce((acc, camera_id) => {
            const count = filteredUploads.filter(upload => upload.camera_id === camera_id).length;
            acc[camera_id] = count;
            return acc;
        }, {});
        const formattedData = cameras.map(camera_id => ({
            label: camera_id,
            count: groupedUploads[camera_id] || 0
        }));

        // Generate recommendations
        recommendations = generateRecommendations(formattedData, filter_value, 'animal');

        console.log('Recommendations:', recommendations);  // Log recommendations

        res.status(200).json({ status: 'success', uploads: formattedData, recommendations });
    } else if (sort_by === 'camera' && filter_value) {
        const filteredUploads = uploads.filter(upload => upload.camera_id === filter_value);
        const groupedUploads = filteredUploads.reduce((acc, upload) => {
            if (!acc[upload.animal]) {
                acc[upload.animal] = 0;
            }
            acc[upload.animal]++;
            return acc;
        }, {});
        const formattedData = Object.keys(groupedUploads).map(animal => ({
            label: animal,
            count: groupedUploads[animal]
        }));

        // Generate recommendations
        recommendations = generateRecommendations(formattedData, filter_value, 'camera');

        console.log('Recommendations:', recommendations);  // Log recommendations

        res.status(200).json({ status: 'success', uploads: formattedData, recommendations });
    } else {
        res.status(400).json({ status: 'error', message: 'Invalid sort option or filter value' });
    }
});

function generateRecommendations(data, filter_value, filter_type) {
    let recommendations = [];
    if (data.length > 0) {
        const maxSightings = Math.max(...data.map(item => item.count));
        const bestOption = data.find(item => item.count === maxSightings);
        if (filter_type === 'animal') {
            recommendations.push(`Based on the selection '${filter_value}', the best camera is '${bestOption.label}'.`);
        } else if (filter_type === 'camera') {
            recommendations.push(`Based on the selection '${filter_value}', the most frequent animal is '${bestOption.label}'.`);
        }
    }
    return recommendations;
}


app.get('/api/users/get_camera_ids', async (req, res) => {
    const { username } = req.query;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const camera_ids = user.gps_pins.map(pin => pin.camera_id);
    res.status(200).json({ status: 'success', camera_ids });
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
