const postMessage = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Message is required',
      });
    }

    const trimmed = message.trim();

    // Simple demo processing. In future, route to actual AI/logic.
    const response = {
      ok: true,
      received: trimmed,
      meta: {
        length: trimmed.length,
        wordCount: trimmed.split(/\s+/).filter(Boolean).length,
        timestamp: new Date().toISOString()
      },
      info: 'This is a demo JSON response from the backend.'
    };

    return res.json(response);
  } catch (error) {
    console.error('Chat message error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};

module.exports = { postMessage };
 
// New: accept user aadhar and message
const postUserMessage = async (req, res) => {
  try {
    const { message, aadharNumber } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }
    if (!aadharNumber || !/^\d{12}$/.test(String(aadharNumber).replace(/\s/g, ''))) {
      return res.status(400).json({ ok: false, error: 'Valid 12-digit aadharNumber is required' });
    }

    const cleanAadhar = String(aadharNumber).replace(/\s/g, '');
    const trimmed = message.trim();

    // Log for verification in terminal
    console.log(`[chat] aadhar=${cleanAadhar} message="${trimmed}"`);

    // For now, just echo back; later, use aadhar to personalize
    return res.json({
      ok: true,
      received: trimmed,
      aadharNumber: cleanAadhar,
      meta: {
        length: trimmed.length,
        wordCount: trimmed.split(/\s+/).filter(Boolean).length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Chat user-message error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
};

module.exports.postUserMessage = postUserMessage;



