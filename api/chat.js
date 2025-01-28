// api/chat.js
async function retry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            if (error?.error?.type === 'overloaded_error') {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
}

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
        const { message, systemPrompt } = req.body;
        
        // Log the API key presence (not the actual key)
        console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);

        const response = await retry(async () => {
            const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-beta': 'messages-2023-12-15'
                },
                body: JSON.stringify({
                    model: 'claude-3-opus-20240229',
                    messages: [{
                        role: 'user',
                        content: message
                    }],
                    system: systemPrompt,
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.text();
                console.error('Anthropic API error:', errorData);
                throw new Error(errorData);
            }

            return apiResponse.json();
        });

        res.status(200).json(response);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: error.message,
            type: error?.error?.type || 'unknown_error'
        });
    }
}
