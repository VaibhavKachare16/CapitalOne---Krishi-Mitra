const mongoose = require('mongoose');

// GET /api/shc/:aadharNumber
const getShcByAadhar = async (req, res) => {
  try {
    const { aadharNumber } = req.params;

    if (!aadharNumber || !/^\d{12}$/.test(aadharNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Valid 12-digit Aadhar number is required' });
    }

    // Convert to number (your AADHAAR_NO is stored as Number)
    const aadharNum = parseInt(aadharNumber.replace(/\s/g, ''), 10);

    const db = mongoose.connection.db;
    const collection = db.collection('shc_norm');

    const docs = await collection
      .find({ AADHAAR_NO: aadharNum })
      .limit(100)
      .toArray();

    return res.json({ count: docs.length, records: docs });
  } catch (error) {
    console.error('getShcByAadhar error:', error);
    return res.status(500).json({ message: 'Error fetching SHC data', error: error.message });
  }
};

module.exports = { getShcByAadhar };



