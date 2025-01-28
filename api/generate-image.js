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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body;
        
        // Debug log - check if we have the API key (don't log the full key!)
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('API Key exists:', !!apiKey);
        console.log('API Key starts with:', apiKey ? apiKey.slice(0, 4) : 'none');
        
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key is not configured' });
        }

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('Making request to OpenAI with prompt:', prompt);

        const response = await fetch('https://api.openai.com/v1/images/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                model: "dall-e-3",
                n: 1,
                size: "1024x1024"
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

        // Check for the expected data structure
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