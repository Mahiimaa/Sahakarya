const express = require('express');
const axios = require('axios');
const router = express.Router();

const getSuggestions = async (req, res) => {
  const { q } = req.query;

  if (!q) return res.status(400).json({ error: "Query required" });

  try {
    // const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    //   params: {
    //     q,
    //     format: 'json',
    //     addressdetails: 1,
    //     limit: 3,
    //     countrycodes: 'np',
    //     extratags: 1,
    //     namedetails: 1,
    //   },
    //   headers: {
    //     'User-Agent': 'Sahakarya/1.0 (sahakarya.help@gmail.com)',
    //   }
    // });
    return res.json([
        { display_name: "Kathmandu, Nepal", lat: "27.7172", lon: "85.3240" },
        { display_name: "Urlabari, Nepal", lat: "26.6609", lon: "87.6286" },
      ]);
  } catch (err) {
    console.error("Error fetching from Nominatim:", err.message);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};

module.exports = {getSuggestions};
