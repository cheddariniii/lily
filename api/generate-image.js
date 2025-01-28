// api/generate-image.js
export default async function handler(req, res) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { prompt } = req.body;
        
        // Debug log
        console.log('Received prompt:', prompt);
        
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('API Key exists:', !!apiKey);
        console.log('API Key starts with:', apiKey ? apiKey.slice(0, 4) : 'none');

        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key is not configured' });
        }

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Create the full request URL - THIS IS THE FIXED URL
        const url = 'https://api.openai.com/v1/images/generations';
        console.log('Making request to URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                response_format: "url"
            })
        });

        console.log('OpenAI response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI error response:', errorText);
            return res.status(response.status).json({ 
                error: 'OpenAI API error',
                details: errorText
            });
        }

        const data = await response.json();
        console.log('OpenAI success response:', JSON.stringify(data, null, 2));

        if (!data.data?.[0]?.url) {
            return res.status(500).json({ 
                error: 'Unexpected response format from OpenAI'
            });
        }

        return res.status(200).json({ url: data.data[0].url });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: error.message });
    }
}
