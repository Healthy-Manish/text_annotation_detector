const API_BASE_URL = 'http://localhost:5000';

export const processFrame = async (imageData, regions, sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/process_frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        regions: regions,
        session_id: sessionId
      })
    });
    return await response.json();
  } catch (error) {
    throw new Error(`Processing failed: ${error.message}`);
  }
};

export const fetchHistory = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/get_history/${sessionId}`);
    const data = await response.json();
    return data.outputs || [];
  } catch (error) {
    throw new Error(`History load failed: ${error.message}`);
  }
};