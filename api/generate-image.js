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
        
        // Debug log
        console.log('Received prompt:', prompt);
        
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key is not configured' });
        }

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('Making request to OpenAI with prompt:', prompt);

        // Note the corrected URL: /v1/images/generations
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
                // Removed the Organization header since it's causing issues
            },
            body: JSON.stringify({
                prompt: prompt,
                model: "dall-e-3",
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
