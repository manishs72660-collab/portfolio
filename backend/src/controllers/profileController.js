const Profile = require('../models/Profile');

async function getProfile(req, res) {
  const profile = await Profile.findOne();
  res.json({ success: true, data: profile });
}

module.exports = { getProfile };
