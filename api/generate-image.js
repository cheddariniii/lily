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
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { prompt } = req.body;
        
        // Log the incoming request
        console.log('Received prompt:', prompt);
        console.log('API Key present:', !!process.env.OPENAI_API_KEY);

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not configured');
        }

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'OpenAI-Organization': process.env.OPENAI_ORG_ID // Optional: if you have an org ID
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

        // Log the OpenAI API response status
        console.log('OpenAI API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenAI API error:', errorData);
            return res.status(response.status).json({ 
                error: 'OpenAI API error', 
                details: errorData 
            });
        }

        const data = await response.json();
        
        // Log successful response structure
        console.log('Response structure:', JSON.stringify(data, null, 2));

        if (!data.data?.[0]?.url) {
            console.error('Invalid response structure:', data);
            return res.status(500).json({ 
                error: 'Invalid response from OpenAI',
                details: 'Response missing expected data structure'
            });
        }

        return res.status(200).json({ url: data.data[0].url });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}